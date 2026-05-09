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
