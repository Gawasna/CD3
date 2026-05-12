import { prisma } from '../config/database';
import pino from 'pino';

const logger = pino({ name: 'cleanup-pending-auctions' });

/**
 * Cleanup Job: Pending Auctions
 * 
 * Quét các auction PENDING quá lâu (> 30 phút) mà không có onChainAuctionId.
 * Đây là dấu hiệu của:
 * - TX blockchain failed nhưng frontend không báo lỗi
 * - Frontend relay failed
 * - Listener chưa kịp xử lý
 * 
 * Action: Log warning để admin kiểm tra manual.
 * Không tự động xóa vì có thể TX đang pending trên mempool.
 */

const PENDING_TIMEOUT_MINUTES = 30;

export async function cleanupPendingAuctions() {
  try {
    const cutoffTime = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60 * 1000);

    const staleAuctions = await prisma.auctionMetadata.findMany({
      where: {
        status: 'PENDING',
        onChainAuctionId: null,
        createdAt: {
          lt: cutoffTime,
        },
      },
      select: {
        id: true,
        createTxHash: true,
        sellerId: true,
        title: true,
        createdAt: true,
      },
    });

    if (staleAuctions.length > 0) {
      logger.warn({
        count: staleAuctions.length,
        auctions: staleAuctions,
      }, 'Found stale PENDING auctions - manual review required');

      // TODO: Send notification to admin dashboard or Slack
      // TODO: Optionally mark as CANCELED after 24h
    } else {
      logger.info('No stale PENDING auctions found');
    }
  } catch (error) {
    logger.error(error, 'Error in cleanupPendingAuctions job');
  }
}

/**
 * Start periodic cleanup job (runs every 10 minutes)
 */
export function startCleanupJob() {
  // Run immediately on startup
  cleanupPendingAuctions();

  // Then run every 10 minutes
  const interval = setInterval(cleanupPendingAuctions, 10 * 60 * 1000);

  logger.info('Cleanup job started (runs every 10 minutes)');

  return () => {
    clearInterval(interval);
    logger.info('Cleanup job stopped');
  };
}
