/**
 * Prisma Seed — CD3 Auction Platform
 * Purpose: tạo dữ liệu demo đủ để test UI và API ngay lập tức
 *
 * Dữ liệu bao gồm:
 *   - 1 Admin user
 *   - 3 User thường (bidder/seller)
 *   - 3 AuctionMetadata ở trạng thái ACTIVE / ENDED / PENDING
 *   - Bid records cho phiên ACTIVE và ENDED
 *   - 1 ShippingLog cho phiên ENDED
 *   - 1 AuthNonce mẫu (chưa dùng)
 */

import { PrismaClient, Prisma, AuctionStatus, AuctionCategory, ShippingStatus } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_ADMIN_WALLET = "0x1000000000000000000000000000000000000001";
const SEED_SELLER_WALLET = "0x1000000000000000000000000000000000000002";
const SEED_BIDDER_1_WALLET = "0x1000000000000000000000000000000000000003";
const SEED_BIDDER_2_WALLET = "0x1000000000000000000000000000000000000004";

async function main(): Promise<void> {
  console.log("Seeding database...");

  // ── 1. Upsert users ──────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { walletAddress: SEED_ADMIN_WALLET },
    update: {},
    create: {
      walletAddress: SEED_ADMIN_WALLET,
      displayName: "Platform Admin",
      role: "ADMIN",
      kycStatus: "APPROVED",
      kycApprovedAt: new Date(),
      kycApprovedBy: null,
      isActive: true,
    },
  });

  const seller = await prisma.user.upsert({
    where: { walletAddress: SEED_SELLER_WALLET },
    update: {},
    create: {
      walletAddress: SEED_SELLER_WALLET,
      displayName: "Alice (Seller)",
      role: "USER",
      kycStatus: "APPROVED",
      kycApprovedAt: new Date(),
      kycApprovedBy: admin.walletAddress,
      isActive: true,
    },
  });

  const bidder1 = await prisma.user.upsert({
    where: { walletAddress: SEED_BIDDER_1_WALLET },
    update: {},
    create: {
      walletAddress: SEED_BIDDER_1_WALLET,
      displayName: "Bob (Bidder)",
      role: "USER",
      kycStatus: "APPROVED",
      kycApprovedAt: new Date(),
      kycApprovedBy: admin.walletAddress,
      isActive: true,
    },
  });

  const bidder2 = await prisma.user.upsert({
    where: { walletAddress: SEED_BIDDER_2_WALLET },
    update: {},
    create: {
      walletAddress: SEED_BIDDER_2_WALLET,
      displayName: "Carol (Bidder)",
      role: "USER",
      kycStatus: "PENDING",
      isActive: true,
    },
  });

  console.log(`Users: admin=${admin.id}, seller=${seller.id}, bidder1=${bidder1.id}, bidder2=${bidder2.id}`);

  // ── 2. Auctions ──────────────────────────────────────────────────────────
  const now = new Date();

  // Phiên ACTIVE — còn 2 ngày
  const activeAuction = await prisma.auctionMetadata.upsert({
    where: { id: "seed-auction-active-001" },
    update: {},
    create: {
      id: "seed-auction-active-001",
      sellerId: seller.id,
      onChainAuctionId: null,
      status: AuctionStatus.ACTIVE,
      title: "Vintage Sony Walkman TPS-L2 (1979)",
      description:
        "Chiếc Walkman đầu tiên của Sony, sản xuất năm 1979. Tình trạng: hoạt động tốt, hộp gốc, đèn LED còn sáng. Một trong những vật phẩm hiếm nhất trong lịch sử âm thanh di động.",
      category: AuctionCategory.ELECTRONICS,
      startingPriceWei: "50000000000000000", // 0.05 ETH
      collateralWei: "5000000000000000",      // 0.005 ETH (10%)
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 ngày
      durationSeconds: 7 * 24 * 60 * 60,     // 7 ngày
      createTxHash: null,
      ipfsCid: null,
    },
  });

  // Phiên ENDED — đã kết thúc, bidder1 thắng
  const endedAuction = await prisma.auctionMetadata.upsert({
    where: { id: "seed-auction-ended-002" },
    update: {},
    create: {
      id: "seed-auction-ended-002",
      sellerId: seller.id,
      onChainAuctionId: null,
      status: AuctionStatus.ENDED,
      title: "Leica M3 Chrome (1954) — Rangefinder Camera",
      description:
        "Máy ảnh Leica M3 nguyên bản sản xuất năm 1954, thân chrome. Kèm ống kính Summicron 50mm f/2. Máy còn hoạt động, đã CLA (clean-lube-adjust) năm 2023.",
      category: AuctionCategory.COLLECTIBLES,
      startingPriceWei: "200000000000000000", // 0.2 ETH
      collateralWei:    "20000000000000000",  // 0.02 ETH
      endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // -1 ngày
      durationSeconds: 3 * 24 * 60 * 60,
      winnerId: bidder1.id,
      createTxHash: null,
      ipfsCid: null,
    },
  });

  // Phiên PENDING — TX chưa confirm on-chain
  const pendingAuction = await prisma.auctionMetadata.upsert({
    where: { id: "seed-auction-pending-003" },
    update: {},
    create: {
      id: "seed-auction-pending-003",
      sellerId: seller.id,
      onChainAuctionId: null,
      status: AuctionStatus.PENDING,
      title: "Herman Miller Aeron Chair — Size B (2022)",
      description:
        "Ghế Herman Miller Aeron Size B, màu graphite, mua năm 2022, còn bảo hành chính hãng đến 2034. Lý do bán: chuyển văn phòng.",
      category: AuctionCategory.FURNITURE,
      startingPriceWei: "100000000000000000", // 0.1 ETH
      collateralWei:    "10000000000000000",  // 0.01 ETH
      endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 ngày
      durationSeconds: 5 * 24 * 60 * 60,
      // TX hash giả — chờ on-chain confirm
      createTxHash: null,
    },
  });

  console.log(`Auctions: active=${activeAuction.id}, ended=${endedAuction.id}, pending=${pendingAuction.id}`);

  // ── 3. Bids ──────────────────────────────────────────────────────────────

  // Bids cho phiên ACTIVE (2 bidder đặt, bidder1 đang dẫn)
  const bid_active_1 = await prisma.bid.upsert({
    where: { txHash: "0x0000000000000000000000000000000000000000000000000000000000000b01" },
    update: {},
    create: {
      auctionId: activeAuction.id,
      bidderId:  bidder1.id,
      amountWei: "60000000000000000", // 0.06 ETH
      txHash:    "0x0000000000000000000000000000000000000000000000000000000000000b01",
      blockNumber: null,
      isWinning: false,
    },
  });

  const bid_active_2 = await prisma.bid.upsert({
    where: { txHash: "0x0000000000000000000000000000000000000000000000000000000000000b02" },
    update: {},
    create: {
      auctionId: activeAuction.id,
      bidderId:  bidder2.id,
      amountWei: "75000000000000000", // 0.075 ETH
      txHash:    "0x0000000000000000000000000000000000000000000000000000000000000b02",
      blockNumber: null,
      isWinning: false,
    },
  });

  const bid_active_3 = await prisma.bid.upsert({
    where: { txHash: "0x0000000000000000000000000000000000000000000000000000000000000b03" },
    update: {},
    create: {
      auctionId: activeAuction.id,
      bidderId:  bidder1.id,
      amountWei: "90000000000000000", // 0.09 ETH — đang dẫn
      txHash:    "0x0000000000000000000000000000000000000000000000000000000000000b03",
      blockNumber: null,
      isWinning: true,
    },
  });

  // Bids cho phiên ENDED (bidder1 thắng)
  const bid_ended_1 = await prisma.bid.upsert({
    where: { txHash: "0x0000000000000000000000000000000000000000000000000000000000000b04" },
    update: {},
    create: {
      auctionId: endedAuction.id,
      bidderId:  bidder1.id,
      amountWei: "250000000000000000", // 0.25 ETH — bid thắng
      txHash:    "0x0000000000000000000000000000000000000000000000000000000000000b04",
      blockNumber: null,
      isWinning: true,
    },
  });

  console.log(`Bids: ${bid_active_1.id}, ${bid_active_2.id}, ${bid_active_3.id}, ${bid_ended_1.id}`);

  // ── 4. ShippingLog cho phiên ENDED ───────────────────────────────────────
  const shippingLog = await prisma.shippingLog.upsert({
    where: { id: "seed-shipping-log-001" },
    update: {},
    create: {
      id:          "seed-shipping-log-001",
      auctionId:   endedAuction.id,
      status:      ShippingStatus.SHIPPED,
      updatedById: seller.id,
      notes:       null,
    },
  });

  console.log(`ShippingLog: ${shippingLog.id}`);

  // ── 5. AuthNonce mẫu ─────────────────────────────────────────────────────
  await prisma.authNonce.upsert({
    where: { nonce: "seed-nonce-demo-000001" },
    update: {},
    create: {
      walletAddress: seller.walletAddress,
      nonce:         "seed-nonce-demo-000001",
      expiresAt:     new Date(now.getTime() - 10 * 60 * 1000),
      usedAt:        new Date(now.getTime() - 5 * 60 * 1000),
    },
  });

  // ── 6. AdminActionLog mẫu ────────────────────────────────────────────────
  await prisma.adminActionLog.upsert({
    where: { id: "seed-admin-log-001" },
    update: {},
    create: {
      id:         "seed-admin-log-001",
      adminId:    admin.id,
      action:     "APPROVE_KYC",
      targetId:   seller.id,
      targetType: "USER",
      metadata:   Prisma.DbNull,
      ipAddress:  null,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
