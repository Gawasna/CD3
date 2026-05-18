import { ethers } from 'ethers';
import { Prisma, AuctionStatus, EscrowStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../shared/utils/api-error';
import { activityService } from '../users/activity.service';
import { eventEmitter, Events } from '../../shared/utils/event-emitter';
import type { RecordBidBody, RequestExtensionBody, CreateAuctionBody } from './auction.schema';

// ── Types ─────────────────────────────────────────────────────────────────

type AuctionWithRelations = Prisma.AuctionMetadataGetPayload<{
  include: {
    seller: {
      select: { id: true, walletAddress: true, displayName: true, avatarUrl: true },
    },
    winner: {
      select: { id: true, walletAddress: true, displayName: true },
    },
    bids: {
      select: {
        id: true,
        amountWei: true,
        txHash: true,
        blockNumber: true,
        isWinning: true,
        createdAt: true,
        bidder: {
          select: { id: true, walletAddress: true, displayName: true },
        },
      },
    },
    _count: { select: { bids: true } },
  }
}>;

type AuctionInList = Prisma.AuctionMetadataGetPayload<{
  include: {
    seller: {
      select: { id: true, walletAddress: true, displayName: true, avatarUrl: true },
    },
    winner: {
      select: { id: true, walletAddress: true, displayName: true },
    },
    _count: { select: { bids: true, watchers: true } },
  }
}>;

type WatchlistItemWithRelations = Prisma.WatchlistGetPayload<{
  include: {
    auction: {
      include: {
        seller: {
          select: { id: true, walletAddress: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { bids: true, watchers: true } },
      },
    },
  }
}>;

// ── Self-bid Validation ───────────────────────────────────────────────────

/**
 * P2 Consensus Gap DB-4: Enforce self-bid constraint at DB layer.
 *
 * Smart contract đã enforce `msg.sender != auction.seller` on-chain.
 * Backend cần enforce lại để bảo vệ off-chain bid mirror khỏi:
 *   - Admin tools ghi trực tiếp vào DB
 *   - Indexer replay events từ chain khác
 *   - Bug trong frontend relay
 *
 * Throws 400 SELF_BID_NOT_ALLOWED nếu bidderId == sellerId của auction.
 */
async function assertNotSelfBid(auctionId: string, bidderId: string): Promise<void> {
  const auction = await prisma.auctionMetadata.findUnique({
    where: { id: auctionId },
    select: { sellerId: true },
  });

  if (!auction) {
    throw ApiError.notFound('AUCTION_NOT_FOUND', 'Auction not found');
  }

  if (auction.sellerId === bidderId) {
    throw ApiError.badRequest(
      'SELF_BID_NOT_ALLOWED',
      'Seller cannot bid on their own auction',
    );
  }
}

// ── Record Bid ────────────────────────────────────────────────────────────

/**
 * Ghi bid vào off-chain mirror sau khi BidPlaced event được confirm on-chain.
 * txHash là dedup key — cùng TX không được insert 2 lần (unique constraint).
 *
 * Flow:
 *   1. Resolve auctionId từ onChainAuctionId
 *   2. Self-bid check
 *   3. Upsert bid (idempotent nếu indexer replay)
 *   4. Sync escrowStatus nếu cần
 */
export async function recordBid(
  bidderId: string,
  input: RecordBidBody,
): Promise<{ bidId: string; isWinning: boolean }> {
  // 1. Resolve off-chain auctionId từ onChainAuctionId
  const auction = await prisma.auctionMetadata.findUnique({
    where: { onChainAuctionId: input.onChainAuctionId },
    select: { id: true, sellerId: true, status: true, title: true },
  });

  if (!auction) {
    throw ApiError.notFound(
      'AUCTION_NOT_FOUND',
      `No auction found for onChainAuctionId ${input.onChainAuctionId}`,
    );
  }

  if (auction.status !== 'ACTIVE') {
    throw ApiError.badRequest(
      'AUCTION_NOT_ACTIVE',
      'Cannot record bid for a non-active auction',
    );
  }

  // 2. Self-bid check (Gap DB-4)
  if (auction.sellerId === bidderId) {
    throw ApiError.badRequest(
      'SELF_BID_NOT_ALLOWED',
      'Seller cannot bid on their own auction',
    );
  }

  // 3. Tìm người giữ giá cao nhất hiện tại (trước khi ghi bid mới)
  const currentHighestBid = await prisma.bid.findFirst({
    where: { auctionId: auction.id },
    orderBy: { amountWei: 'desc' },
    select: { bidderId: true, amountWei: true },
  });

  // 4. Upsert bid — txHash unique constraint làm dedup key tự nhiên
  //    Nếu TX đã tồn tại (indexer replay), update blockNumber nếu chưa có
  const bid = await prisma.bid.upsert({
    where: { txHash: input.txHash },
    update: {
      // Chỉ update blockNumber nếu chưa được set (indexer có thể gửi lại với block đầy đủ)
      ...(input.blockNumber !== undefined ? { blockNumber: input.blockNumber } : {}),
    },
    create: {
      auctionId: auction.id,
      bidderId,
      amountWei: input.amountWei,
      txHash: input.txHash,
      blockNumber: input.blockNumber ?? null,
      isWinning: false, // sẽ được update khi auction ENDED
    },
    select: { id: true, isWinning: true },
  });

  // 5. Ghi activity BID_PLACED
  await activityService.logActivity(bidderId, 'BID_PLACED', auction.id, 'AUCTION', {
    amount: input.amountWei,
    txHash: input.txHash,
  });

  // 6. Phát sự kiện BID.PLACED để gửi thông báo (Bidder success & Outbid warning)
  eventEmitter.emit(Events.BID.PLACED, {
    auctionId: auction.id,
    bidderId,
    amount: ethers.formatEther(input.amountWei),
    title: auction.title,
    previousBidderId: currentHighestBid?.bidderId,
  });

  return { bidId: bid.id, isWinning: bid.isWinning };
}

// ── Request Delivery Extension ────────────────────────────────────────────

/**
 * P2 Consensus C-03: Buyer yêu cầu gia hạn thêm 7 ngày delivery deadline.
 *
 * Backend chỉ ghi nhận sự kiện sau khi TX on-chain đã thành công.
 * Contract đã enforce:
 *   - Chỉ winner được gọi
 *   - Chỉ được trong AwaitingDelivery
 *   - Chỉ được 1 lần (deliveryExtensionUsed flag)
 *
 * Backend enforce thêm:
 *   - Caller phải là winner (winnerId của auction)
 *   - Auction phải ở escrowStatus AWAITING_DELIVERY
 *   - Chưa có extension record trước đó (idempotent guard)
 *
 * Ghi AdminActionLog với action DELIVERY_EXTENSION_REQUESTED để track pattern.
 */
export async function requestDeliveryExtension(
  callerId: string,
  auctionId: string,
  input: RequestExtensionBody,
): Promise<{ auctionId: string; txHash: string }> {
  // 1. Load auction với đủ thông tin cần thiết
  const auction = await prisma.auctionMetadata.findUnique({
    where: { id: auctionId },
    select: {
      id: true,
      winnerId: true,
      escrowStatus: true,
      sellerId: true,
    },
  });

  if (!auction) {
    throw ApiError.notFound('AUCTION_NOT_FOUND', 'Auction not found');
  }

  // 2. Chỉ winner được request extension
  if (auction.winnerId !== callerId) {
    throw ApiError.forbidden(
      'NOT_WINNER',
      'Only the auction winner can request a delivery extension',
    );
  }

  // 3. Chỉ được trong trạng thái AWAITING_DELIVERY
  if (auction.escrowStatus !== 'AWAITING_DELIVERY') {
    throw ApiError.badRequest(
      'INVALID_ESCROW_STATE',
      `Delivery extension requires AWAITING_DELIVERY state, current: ${auction.escrowStatus}`,
    );
  }

  // 4. Idempotent guard — nếu txHash đã được ghi nhận, trả về thành công luôn
  //    (frontend có thể retry nếu network lỗi sau khi TX confirm)
  const existingLog = await prisma.adminActionLog.findFirst({
    where: {
      targetId: auctionId,
      targetType: 'AUCTION',
      action: 'DELIVERY_EXTENSION_REQUESTED',
    },
    select: { id: true },
  });

  if (existingLog) {
    // Đã ghi nhận rồi — idempotent response
    return { auctionId, txHash: input.txHash };
  }

  // 5. Ghi log — dùng AdminActionLog để track pattern abuse
  //    (user request extension nhiều lần trên nhiều auction → flag)
  await prisma.adminActionLog.create({
    data: {
      adminId: callerId,   // reuse adminId field — đây là actor, không nhất thiết là admin
      action: 'DELIVERY_EXTENSION_REQUESTED',
      targetId: auctionId,
      targetType: 'AUCTION',
      metadata: {
        txHash: input.txHash,
        requestedBy: callerId,
      },
    },
  });

  return { auctionId, txHash: input.txHash };
}

// ── Get Auction ───────────────────────────────────────────────────────────

/**
 * Lấy auction metadata từ DB theo UUID.
 * Dùng cho frontend polling — không cần auth.
 */
export async function getAuctionById(auctionId: string) {
  const auction = (await prisma.auctionMetadata.findUnique({
    where: { id: auctionId },
    include: {
      seller: {
        select: { id: true, walletAddress: true, displayName: true, avatarUrl: true },
      },
      winner: {
        select: { id: true, walletAddress: true, displayName: true },
      },
      bids: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          amountWei: true,
          txHash: true,
          blockNumber: true,
          isWinning: true,
          createdAt: true,
          bidder: {
            select: { id: true, walletAddress: true, displayName: true },
          },
        },
      },
      _count: { select: { bids: true } },
    },
  })) as AuctionWithRelations | null;

  if (!auction) {
    throw ApiError.notFound('AUCTION_NOT_FOUND', 'Auction not found');
  }

  // Convert BigInt fields to strings for JSON serialization
  return {
    ...auction,
    onChainAuctionId: auction.onChainAuctionId?.toString() ?? null,
    bids: auction.bids.map((bid) => ({
      ...bid,
      blockNumber: bid.blockNumber?.toString() ?? null,
    })),
  };
}

/**
 * Lấy danh sách auctions với filter và pagination.
 * Hỗ trợ variants: ending-soon, live, upcoming cho Homepage.
 * Hỗ trợ search keyword và đa category cho Explore.
 */
export async function listAuctions(params: {
  status?: string;
  variant?: string;
  sellerId?: string;
  bidderId?: string;
  search?: string;
  categories?: string[];
  sortBy?: string;
  page: number;
  limit: number;
}) {
  const { status, variant, sellerId, bidderId, search, categories, sortBy, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.AuctionMetadataWhereInput = {};
  const andConditions: any[] = [];

  // 1. Status Filter
  if (status) {
    andConditions.push({ status: status as AuctionStatus });
  } else if (!sellerId && !bidderId && !variant && !search && (!categories || categories.length === 0)) {
    // Cho phép hiển thị PENDING, UPCOMING, ACTIVE mặc định cho public list
    andConditions.push({ 
      status: { 
        in: ['PENDING', 'UPCOMING', 'ACTIVE'] as AuctionStatus[] 
      } 
    });
  }

  // 2. Seller / Bidder Filter
  if (sellerId) andConditions.push({ sellerId });
  if (bidderId) {
    andConditions.push({ bids: { some: { bidderId } } });
  }

  // 3. Search Keyword (kết hợp với AND)
  if (search) {
    andConditions.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  // 4. Categories Filter
  if (categories && categories.length > 0) {
    andConditions.push({
      category: {
        in: categories.map((c) => c.toUpperCase()) as any,
      },
    });
  }

  // 5. Variant logic (Homepage & Dashboard)
  if (variant === 'ending-soon') {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    andConditions.push({
      status: 'ACTIVE' as AuctionStatus,
      endTime: { gt: now, lte: next24h },
    });
  } else if (variant === 'live') {
    const now = new Date();
    andConditions.push({
      status: 'ACTIVE' as AuctionStatus,
      startTime: { lte: now },
      endTime: { gt: now },
    });
  } else if (variant === 'upcoming') {
    const now = new Date();
    andConditions.push({
      OR: [
        { status: 'PENDING' as AuctionStatus },
        { status: 'UPCOMING' as AuctionStatus },
        { status: 'ACTIVE' as AuctionStatus, startTime: { gt: now } }
      ]
    });
  } else if (variant === 'won' && bidderId) {
    // P2 Consensus: Filter auctions where the user is the winner
    andConditions.push({
      winnerId: bidderId,
      status: 'ENDED' as AuctionStatus,
    });
  }

  // Tổng hợp vào where.AND
  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // 7. Xử lý Sorting
  let orderBy: Prisma.AuctionMetadataOrderByWithRelationInput = { createdAt: 'desc' };

  if (variant === 'ending-soon' || sortBy === 'ending_soon') {
    orderBy = { endTime: 'asc' };
  } else if (sortBy === 'newest') {
    orderBy = { createdAt: 'desc' };
  } else if (sortBy === 'price_low') {
    orderBy = { startingPriceWei: 'asc' };
  } else if (sortBy === 'price_high') {
    orderBy = { startingPriceWei: 'desc' };
  } else if (sortBy === 'most_bids') {
    orderBy = {
      bids: {
        _count: 'desc',
      },
    };
  }

  const [auctions, total] = await Promise.all([
    prisma.auctionMetadata.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        seller: {
          select: { id: true, walletAddress: true, displayName: true, avatarUrl: true },
        },
        winner: {
          select: { id: true, walletAddress: true, displayName: true },
        },
        _count: { select: { bids: true, watchers: true } },
      },
    }) as Promise<AuctionInList[]>,
    prisma.auctionMetadata.count({ where }),
  ]);

  // Convert BigInt fields to strings for JSON serialization
  const serializedAuctions = auctions.map((auction) => ({
    ...auction,
    onChainAuctionId: auction.onChainAuctionId?.toString() ?? null,
  }));

  return {
    data: serializedAuctions,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ── Watchlist ─────────────────────────────────────────────────────────────

/**
 * Thêm một auction vào watchlist của user.
 */
export async function addToWatchlist(userId: string, auctionId: string) {
  // Check if auction exists
  const auction = await prisma.auctionMetadata.findUnique({
    where: { id: auctionId },
    select: { id: true },
  });

  if (!auction) {
    throw ApiError.notFound('AUCTION_NOT_FOUND', 'Auction not found');
  }

  // Use upsert to be idempotent
  return prisma.watchlist.upsert({
    where: {
      userId_auctionId: { userId, auctionId },
    },
    update: {}, // Do nothing if already exists
    create: { userId, auctionId },
  });
}

/**
 * Xóa một auction khỏi watchlist của user.
 */
export async function removeFromWatchlist(userId: string, auctionId: string) {
  return prisma.watchlist.deleteMany({
    where: { userId, auctionId },
  });
}

/**
 * Lấy danh sách auctions trong watchlist của user.
 */
export async function getWatchlist(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        auction: {
          include: {
            seller: {
              select: { id: true, walletAddress: true, displayName: true, avatarUrl: true },
            },
            _count: { select: { bids: true, watchers: true } },
          },
        },
      },
    }) as Promise<WatchlistItemWithRelations[]>,
    prisma.watchlist.count({ where: { userId } }),
  ]);

  const serializedAuctions = items.map((item) => ({
    ...item.auction,
    onChainAuctionId: item.auction.onChainAuctionId?.toString() ?? null,
    addedToWatchlistAt: item.createdAt,
  }));

  return {
    data: serializedAuctions,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ── Sync Escrow Status ────────────────────────────────────────────────────


/**
 * Sync escrowStatus từ on-chain event về DB.
 * Được gọi bởi event listener hoặc frontend relay sau mỗi state transition.
 *
 * Chỉ cho phép transition hợp lệ theo state machine:
 *   NONE → AWAITING_SHIPMENT (sau endAuction / Buy Now)
 *   AWAITING_SHIPMENT → AWAITING_DELIVERY (sau markShipped)
 *   AWAITING_SHIPMENT → DISPUTED (sau raiseDispute + 48h delay)
 *   AWAITING_DELIVERY → DISPUTED (sau raiseDispute)
 *   AWAITING_DELIVERY → COMPLETED (sau confirmDelivery / claimFunds)
 *   DISPUTED → REFUNDED (sau resolveDispute)
 *   AWAITING_SHIPMENT → REFUNDED (sau forfeitWin)
 */
const VALID_ESCROW_TRANSITIONS: Record<string, string[]> = {
  NONE:               ['AWAITING_SHIPMENT', 'REFUNDED'],
  AWAITING_SHIPMENT:  ['AWAITING_DELIVERY', 'DISPUTED', 'REFUNDED'],
  AWAITING_DELIVERY:  ['COMPLETED', 'DISPUTED'],
  DISPUTED:           ['REFUNDED', 'COMPLETED'],
  COMPLETED:          [],
  REFUNDED:           [],
};

export async function syncEscrowStatus(
  auctionId: string,
  newEscrowStatus: string,
  newAuctionStatus?: string,
): Promise<void> {
  const auction = await prisma.auctionMetadata.findUnique({
    where: { id: auctionId },
    select: { escrowStatus: true, status: true },
  });

  if (!auction) {
    throw ApiError.notFound('AUCTION_NOT_FOUND', 'Auction not found');
  }

  const currentEscrow = auction.escrowStatus as string;
  const allowed = VALID_ESCROW_TRANSITIONS[currentEscrow] ?? [];

  if (!allowed.includes(newEscrowStatus)) {
    throw ApiError.badRequest(
      'INVALID_ESCROW_TRANSITION',
      `Cannot transition escrow from ${currentEscrow} to ${newEscrowStatus}`,
    );
  }

  await prisma.auctionMetadata.update({
    where: { id: auctionId },
    data: {
      escrowStatus: newEscrowStatus as EscrowStatus,
      ...(newAuctionStatus ? { status: newAuctionStatus as AuctionStatus } : {}),
    },
  });
}

// ── Create Pending Auction ────────────────────────────────────────────────

/**
 * Tạo auction mới với status PENDING.
 * Được gọi sau khi frontend gửi TX createAuction lên blockchain.
 * 
 * Flow:
 *   1. Frontend upload media -> nhận mediaKeys
 *   2. Frontend gửi TX createAuction -> nhận txHash
 *   3. Frontend gọi API này với txHash và mediaKeys
 *   4. Backend tạo record PENDING
 *   5. Listener lắng nghe AuctionCreated event -> update onChainAuctionId và status ACTIVE
 */
export async function createPendingAuction(
  sellerId: string,
  input: CreateAuctionBody,
): Promise<{ auctionId: string }> {
  // Validate KYC status
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { kycStatus: true, isActive: true },
  });

  if (!seller) {
    throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
  }

  if (!seller.isActive) {
    throw ApiError.forbidden('USER_SUSPENDED', 'Your account has been suspended');
  }

  if (seller.kycStatus !== 'APPROVED') {
    throw ApiError.forbidden(
      'KYC_NOT_APPROVED',
      'You must complete KYC verification to create auctions',
    );
  }

  // Validate buyNowPrice > startingPrice nếu có
  if (input.buyNowPriceWei) {
    const buyNow = BigInt(input.buyNowPriceWei);
    const starting = BigInt(input.startingPriceWei);
    if (buyNow <= starting) {
      throw ApiError.badRequest(
        'INVALID_BUY_NOW_PRICE',
        'Buy Now price must be greater than starting price',
      );
    }
  }

  // Tính startTime và endTime
  const startTime = input.startTime ? new Date(input.startTime) : new Date();
  const endTime = new Date(startTime.getTime() + input.durationSeconds * 1000);

  // Tạo auction với status PENDING
  const auction = await prisma.auctionMetadata.create({
    data: {
      sellerId,
      status: 'PENDING',
      escrowStatus: 'NONE',
      title: input.title,
      description: input.description,
      category: input.category,
      startingPriceWei: input.startingPriceWei,
      buyNowPriceWei: input.buyNowPriceWei ?? null,
      collateralWei: '0', // Sẽ được update từ on-chain event nếu cần
      startTime,
      endTime,
      durationSeconds: input.durationSeconds,
      shippingCostWei: input.shippingCostWei,
      shippingPayer: input.shippingPayer,
      createTxHash: input.createTxHash,
      // Lưu mediaKeys vào ipfsCid tạm thời (hoặc có thể tạo field mới)
      // Ở đây dùng JSON.stringify để lưu array
      ipfsCid: JSON.stringify(input.mediaKeys),
    },
    select: { id: true },
  });

  // Ghi activity AUCTION_CREATED
  await activityService.logActivity(sellerId, 'AUCTION_CREATED', auction.id, 'AUCTION', {
    title: input.title,
  });

  // Phát sự kiện để gửi thông báo (nếu cần cho admin hoặc followers sau này)
  eventEmitter.emit(Events.AUCTION.CREATED, {
    auctionId: auction.id,
    sellerId,
  });

  return { auctionId: auction.id };
}
