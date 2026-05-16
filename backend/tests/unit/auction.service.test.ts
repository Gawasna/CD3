import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/config/database';
import { notificationService } from '../../src/modules/notification/notification.service';
import { recordBid } from '../../src/modules/auction/auction.service';

vi.mock('../../src/config/database', () => ({
  prisma: {
    auctionMetadata: {
      findUnique: vi.fn(),
    },
    bid: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../../src/modules/notification/notification.service', () => ({
  notificationService: {
    createNotification: vi.fn(),
  },
}));

describe('auction.service - recordBid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const bidderId = 'bidder-id';
  const sellerId = 'seller-id';
  const auctionId = 'auction-id';
  const input = {
    onChainAuctionId: '1',
    amountWei: '1000000000000000000', // 1 ETH
    txHash: '0x123',
    blockNumber: 123456,
  };

  const mockAuction = {
    id: auctionId,
    sellerId,
    status: 'ACTIVE',
    title: 'Test Auction',
  };

  it('sends notification to seller when a bid is recorded', async () => {
    vi.mocked(prisma.auctionMetadata.findUnique).mockResolvedValue(mockAuction as any);
    vi.mocked(prisma.bid.findFirst).mockResolvedValue(null); // No existing bids
    vi.mocked(prisma.bid.upsert).mockResolvedValue({ id: 'bid-1', isWinning: false } as any);

    await recordBid(bidderId, input);

    expect(notificationService.createNotification).toHaveBeenCalledWith(sellerId, {
      type: 'INFO',
      title: 'Có lượt đặt giá mới!',
      message: expect.stringContaining('Test Auction'),
      actionUrl: `/auctions/${auctionId}`,
    });
    
    // Should be called exactly once since there's no outbid bidder
    expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
  });

  it('sends notifications to both seller and outbid bidder', async () => {
    const outbidBidderId = 'outbid-bidder-id';
    const currentHighestBid = {
      bidderId: outbidBidderId,
      amountWei: '500000000000000000', // 0.5 ETH
    };

    vi.mocked(prisma.auctionMetadata.findUnique).mockResolvedValue(mockAuction as any);
    vi.mocked(prisma.bid.findFirst).mockResolvedValue(currentHighestBid as any);
    vi.mocked(prisma.bid.upsert).mockResolvedValue({ id: 'bid-2', isWinning: false } as any);

    await recordBid(bidderId, input);

    // Notification to outbid bidder
    expect(notificationService.createNotification).toHaveBeenCalledWith(outbidBidderId, {
      type: 'WARNING',
      title: 'Bạn đã bị vượt giá!',
      message: expect.stringContaining('Test Auction'),
      actionUrl: `/auctions/${auctionId}`,
    });

    // Notification to seller
    expect(notificationService.createNotification).toHaveBeenCalledWith(sellerId, {
      type: 'INFO',
      title: 'Có lượt đặt giá mới!',
      message: expect.stringContaining('Test Auction'),
      actionUrl: `/auctions/${auctionId}`,
    });

    expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
  });
});
