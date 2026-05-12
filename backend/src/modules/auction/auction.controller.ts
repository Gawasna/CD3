import { Request, Response, NextFunction } from 'express';
import {
  recordBid,
  requestDeliveryExtension,
  getAuctionById,
  listAuctions,
  syncEscrowStatus,
  createPendingAuction,
} from './auction.service';
import type {
  AuctionIdParam,
  RecordBidBody,
  RequestExtensionBody,
  CreateAuctionBody,
} from './auction.schema';

// ── GET /api/v1/auctions ──────────────────────────────────────────────────

export async function getAuctions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string | undefined;
    const variant = req.query.variant as string | undefined;

    const result = await listAuctions({ status, variant, page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/auctions/:auctionId ──────────────────────────────────────

export async function getAuction(
  req: Request<AuctionIdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auction = await getAuctionById(req.params.auctionId);
    res.status(200).json({ auction });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/v1/auctions/:auctionId/bids ────────────────────────────────

/**
 * Frontend relay: sau khi BidPlaced event confirm on-chain,
 * gọi endpoint này để ghi vào off-chain mirror.
 * Self-bid validation được enforce trong service.
 */
export async function postBid(
  req: Request<AuctionIdParam, unknown, RecordBidBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await recordBid(req.user!.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// ── POST /api/v1/auctions/:auctionId/delivery-extension ──────────────────

/**
 * P2 Consensus C-03: Buyer request gia hạn thêm 7 ngày delivery deadline.
 *
 * Caller phải là winner của auction.
 * TX on-chain (requestDeliveryExtension) phải đã được confirm trước khi gọi endpoint này.
 * Backend ghi log để track pattern abuse.
 */
export async function postDeliveryExtension(
  req: Request<AuctionIdParam, unknown, RequestExtensionBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await requestDeliveryExtension(
      req.user!.id,
      req.params.auctionId,
      req.body,
    );
    res.status(200).json({
      message: 'Delivery extension recorded successfully',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/v1/auctions/:auctionId/escrow-status ──────────────────────

/**
 * Internal relay: sync escrowStatus từ on-chain event về DB.
 * Chỉ dùng bởi event listener hoặc trusted frontend relay.
 * Validate state machine transition trong service.
 */
export async function patchEscrowStatus(
  req: Request<AuctionIdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { escrowStatus, auctionStatus } = req.body as {
      escrowStatus: string;
      auctionStatus?: string;
    };

    if (!escrowStatus) {
      res.status(400).json({ code: 'MISSING_FIELD', message: 'escrowStatus is required' });
      return;
    }

    await syncEscrowStatus(req.params.auctionId, escrowStatus, auctionStatus);
    res.status(200).json({ message: 'Escrow status synced' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/v1/auctions ─────────────────────────────────────────────────

/**
 * Tạo auction mới.
 * Yêu cầu KYC APPROVED.
 */
export async function postAuction(
  req: Request<unknown, unknown, CreateAuctionBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await createPendingAuction(req.user!.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// ── POST /api/v1/auctions/media ───────────────────────────────────────────

/**
 * Upload media files cho auction.
 * Trả về danh sách filenames để frontend gửi trong createAuction.
 */
export async function postAuctionMedia(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        code: 'NO_FILES',
        message: 'No files uploaded',
      });
      return;
    }

    const filenames = req.files.map((file) => file.filename);
    res.status(200).json({ filenames });
  } catch (err) {
    next(err);
  }
}
