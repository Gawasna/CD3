import { prisma } from '../config/database';
import { notificationService } from '../modules/notification/notification.service';

/**
 * Cleanup / Update job for auctions.
 * 
 * - Chuyển trạng thái UPCOMING -> ACTIVE khi tới startTime.
 * - Thông báo cho Watchlist khi auction sắp bắt đầu/kết thúc.
 */
export async function startAuctionStatusJob() {
  console.log('[AuctionJob] Starting status update job (every 1 minute)');

  // Chạy mỗi phút
  setInterval(async () => {
    try {
      const now = new Date();

      // 1. Chuyển UPCOMING -> ACTIVE
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

      // 2. Thông báo "Sắp bắt đầu" (15 phút trước khi start)
      const startingSoonThreshold = new Date(now.getTime() + 15 * 60 * 1000);
      const startingSoonLower = new Date(now.getTime() + 14 * 60 * 1000);

      const startingSoonAuctions = await prisma.auctionMetadata.findMany({
        where: {
          status: 'UPCOMING',
          startTime: {
            gt: startingSoonLower,
            lte: startingSoonThreshold,
          },
        },
        include: {
          watchers: {
            select: { userId: true },
          },
        },
      });

      for (const auction of startingSoonAuctions) {
        for (const watcher of auction.watchers) {
          await notificationService.createNotification(watcher.userId, {
            type: 'INFO',
            title: 'Sản phẩm bạn theo dõi sắp bắt đầu!',
            message: `Sản phẩm "${auction.title}" sẽ chính thức bắt đầu đấu giá trong 15 phút nữa. Đừng bỏ lỡ!`,
            actionUrl: `/auctions/${auction.id}`,
          });
        }
      }

      // 3. Thông báo "Sắp kết thúc" (60 phút trước khi end)
      const endingSoonThreshold = new Date(now.getTime() + 60 * 60 * 1000);
      const endingSoonLower = new Date(now.getTime() + 59 * 60 * 1000);

      const endingSoonAuctions = await prisma.auctionMetadata.findMany({
        where: {
          status: 'ACTIVE',
          endTime: {
            gt: endingSoonLower,
            lte: endingSoonThreshold,
          },
        },
        include: {
          watchers: {
            select: { userId: true },
          },
        },
      });

      for (const auction of endingSoonAuctions) {
        for (const watcher of auction.watchers) {
          await notificationService.createNotification(watcher.userId, {
            type: 'WARNING',
            title: 'Sản phẩm bạn theo dõi sắp kết thúc!',
            message: `Chỉ còn 1 giờ nữa là phiên đấu giá "${auction.title}" sẽ kết thúc. Hãy kiểm tra lại mức giá của bạn!`,
            actionUrl: `/auctions/${auction.id}`,
          });
        }
      }

    } catch (error) {
      console.error('[AuctionJob] Error in status update job:', error);
    }
  }, 60 * 1000); // 1 minute
}
