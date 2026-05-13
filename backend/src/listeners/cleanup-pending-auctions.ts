import { prisma } from '../config/database';
import pino from 'pino';
import { cleanupExpiredNonces } from '../modules/auth/auth.service';

const logger = pino({ name: 'cleanup-jobs' });

/**
 * Cleanup Job: Pending Auctions & Auth Nonces
 * 
 * 1. Quét các auction PENDING quá lâu (> 30 phút) mà không có onChainAuctionId.
 * 2. Xóa các Auth Nonce đã hết hạn.
 */

const PENDING_TIMEOUT_MINUTES = 30;

export async function runCleanupJobs() {
  try {
    // 1. Cleanup Stale Auctions
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
    }

    // 2. Cleanup Expired Nonces
    const deletedNonces = await cleanupExpiredNonces();
    if (deletedNonces > 0) {
      logger.info({ count: deletedNonces }, 'Cleaned up expired auth nonces');
    }

  } catch (error) {
    logger.error(error, 'Error in runCleanupJobs');
  }
}

/**
 * Start periodic cleanup job (runs every 10 minutes)
 */
export function startCleanupJob() {
  // Run immediately on startup
  runCleanupJobs();

  // Then run every 10 minutes
  const interval = setInterval(runCleanupJobs, 10 * 60 * 1000);

  logger.info('Cleanup job started (runs every 10 minutes)');

  return () => {
    clearInterval(interval);
    logger.info('Cleanup job stopped');
  };
}
