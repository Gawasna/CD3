import { z } from 'zod';

// ── Params ────────────────────────────────────────────────────────────────

export const auctionIdParamSchema = z.object({
  auctionId: z.string().uuid('auctionId must be a valid UUID'),
});

export type AuctionIdParam = z.infer<typeof auctionIdParamSchema>;

// ── Bid ───────────────────────────────────────────────────────────────────

/**
 * Body khi backend nhận event BidPlaced từ on-chain indexer / frontend relay.
 * amountWei là decimal string để tránh precision loss uint256 → JSON.
 */
export const recordBidBodySchema = z.object({
  onChainAuctionId: z.coerce.bigint().positive('onChainAuctionId must be positive'),
  txHash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'txHash must be a valid 32-byte hex string'),
  amountWei: z
    .string()
    .regex(/^[0-9]+$/, 'amountWei must be a non-negative integer string'),
  blockNumber: z.coerce.bigint().positive().optional(),
});

export type RecordBidBody = z.infer<typeof recordBidBodySchema>;

// ── Delivery Extension ────────────────────────────────────────────────────

/**
 * Body khi buyer yêu cầu gia hạn thêm 7 ngày.
 * txHash là proof on-chain sau khi gọi requestDeliveryExtension() thành công.
 */
export const requestExtensionBodySchema = z.object({
  txHash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'txHash must be a valid 32-byte hex string'),
});

export type RequestExtensionBody = z.infer<typeof requestExtensionBodySchema>;

// ── Create Auction ────────────────────────────────────────────────────────

/**
 * Body khi tạo auction mới.
 * Đồng bộ với Prisma enum AuctionCategory.
 */
export const createAuctionBodySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['ELECTRONICS', 'FASHION', 'FURNITURE', 'COLLECTIBLES', 'OTHER']),
  startingPriceWei: z.string().regex(/^[0-9]+$/, 'startingPriceWei must be a non-negative integer string'),
  buyNowPriceWei: z.string().regex(/^[0-9]+$/, 'buyNowPriceWei must be a non-negative integer string').optional(),
  startTime: z.string().datetime('startTime must be a valid ISO 8601 date string').optional(),
  durationSeconds: z.number().int().min(3600, 'Duration must be at least 1 hour (3600 seconds)'),
  shippingCostWei: z.string().regex(/^[0-9]+$/, 'shippingCostWei must be a non-negative integer string'),
  shippingPayer: z.enum(['BUYER', 'SELLER', 'PLATFORM']),
  createTxHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'createTxHash must be a valid 32-byte hex string'),
  mediaKeys: z.array(z.string()).min(1, 'At least one media file is required').max(6, 'Maximum 6 media files allowed'),
});

export type CreateAuctionBody = z.infer<typeof createAuctionBodySchema>;

// ── Watchlist ─────────────────────────────────────────────────────────────

export const watchlistParamsSchema = z.object({
  auctionId: z.string().uuid('auctionId must be a valid UUID'),
});

export type WatchlistParams = z.infer<typeof watchlistParamsSchema>;

