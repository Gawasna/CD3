import { prisma } from '../config/database';

/**
 * Cleanup / Update job for auctions.
 * 
 * - Chuyển trạng thái UPCOMING -> ACTIVE khi tới startTime.
 * - (Optional) Cleanup các pending auctions quá lâu.
 */
export async function startAuctionStatusJob() {
  console.log('[AuctionJob] Starting status update job (every 1 minute)');

  // Chạy mỗi phút
  setInterval(async () => {
    try {
      const now = new Date();

      // Find auctions that should be ACTIVE
      const upcomingToActive = await prisma.auctionMetadata.updateMany({
        where: {
          status: 'UPCOMING',
          startTime: { lte: now },
        },
        data: {
          status: 'ACTIVE',
        },
      });

      if (upcomingToActive.count > 0) {
        console.log(`[AuctionJob] Transferred ${upcomingToActive.count} auctions from UPCOMING to ACTIVE`);
      }

      // Cũng xử lý trường hợp PENDING nhưng đã confirmed on-chain mà listener miss (fallback)
      // Thường sẽ xử lý trong một job đồng bộ on-chain đầy đủ hơn, nhưng ở đây tạm thời focus vào UPCOMING
    } catch (error) {
      console.error('[AuctionJob] Error in status update job:', error);
    }
  }, 60 * 1000); // 1 minute
}
