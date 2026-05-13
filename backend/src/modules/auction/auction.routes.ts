import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { uploadAuctionMiddleware } from '../../shared/middleware/upload';
import { auctionIdParamSchema, recordBidBodySchema, requestExtensionBodySchema, createAuctionBodySchema } from './auction.schema';
import {
  getAuctions,
  getAuction,
  postBid,
  postDeliveryExtension,
  patchEscrowStatus,
  postAuction,
  postAuctionMedia,
} from './auction.controller';

const router = Router();

// ── Public routes (no auth) ───────────────────────────────────────────────

// GET /api/v1/auctions?status=ACTIVE&variant=ending-soon&page=1&limit=20
router.get('/', getAuctions);

// GET /api/v1/auctions/:auctionId
router.get(
  '/:auctionId',
  validate(auctionIdParamSchema, 'params'),
  getAuction,
);

// ── Authenticated routes ──────────────────────────────────────────────────

// POST /api/v1/auctions/media
// Upload media files trước khi tạo auction
router.post(
  '/media',
  authenticate,
  uploadAuctionMiddleware.array('media', 6),
  postAuctionMedia,
);

// POST /api/v1/auctions
// Tạo auction mới (yêu cầu KYC APPROVED)
router.post(
  '/',
  authenticate,
  validate(createAuctionBodySchema, 'body'),
  postAuction,
);

// POST /api/v1/auctions/:auctionId/bids
// Relay: ghi bid vào off-chain mirror sau khi BidPlaced event confirm on-chain.
// Self-bid validation trong service.
router.post(
  '/:auctionId/bids',
  authenticate,
  validate(auctionIdParamSchema, 'params'),
  validate(recordBidBodySchema, 'body'),
  postBid,
);

// POST /api/v1/auctions/:auctionId/delivery-extension
// Consensus C-03: Buyer request gia hạn thêm 7 ngày.
// Chỉ winner được gọi — enforce trong service.
router.post(
  '/:auctionId/delivery-extension',
  authenticate,
  validate(auctionIdParamSchema, 'params'),
  validate(requestExtensionBodySchema, 'body'),
  postDeliveryExtension,
);

// PATCH /api/v1/auctions/:auctionId/escrow-status
// Internal relay: sync escrowStatus từ on-chain event.
// Dùng authenticate để chỉ logged-in user/system mới gọi được.
router.patch(
  '/:auctionId/escrow-status',
  authenticate,
  validate(auctionIdParamSchema, 'params'),
  patchEscrowStatus,
);

export default router;
