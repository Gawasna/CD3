import { prisma } from '../config/database';
import { eventEmitter, Events } from '../shared/utils/event-emitter';
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
      // Tìm các auction sắp chuyển trạng thái để phát sự kiện
      const auctionsToStart = await prisma.auctionMetadata.findMany({
        where: {
          status: 'UPCOMING',
          startTime: { lte: now },
        },
        include: {
          watchers: { select: { userId: true } },
        },
      });

      if (auctionsToStart.length > 0) {
        await prisma.auctionMetadata.updateMany({
          where: {
            id: { in: auctionsToStart.map((a: any) => a.id) },
          },
          data: { status: 'ACTIVE' },
        });

        // Phát sự kiện AUCTION.STARTED cho từng auction
        for (const auction of auctionsToStart) {
          eventEmitter.emit(Events.AUCTION.STARTED, {
            auctionId: auction.id,
            sellerId: auction.sellerId,
            title: auction.title,
            watcherIds: auction.watchers.map((w: any) => w.userId),
          });
        }
        
        console.log(`[AuctionJob] Transferred ${auctionsToStart.length} auctions from UPCOMING to ACTIVE`);
      }

      // 2. Thông báo "Sắp bắt đầu" (15 phút trước khi start)
      // Dùng trực tiếp eventEmitter nếu muốn, nhưng ở đây có logic message đặc thù
      // Để đơn giản, ta vẫn dùng notificationService cho các job notify đặc thù 
      // HOẶC tạo sự kiện mới. Ở đây tôi sẽ giữ nguyên cấu trúc phát sự kiện.
      // Tuy nhiên, NotificationListener hiện tại chưa có sự kiện "SẮP BẮT ĐẦU".
      // Tôi sẽ import notificationService lại chỉ cho các thông báo "SOON" này 
      // hoặc mở rộng Events.
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

      // 4. Chuyển ACTIVE -> ENDED cho các auction đã hết giờ
      // Tự động xác định winner từ bid cao nhất trong DB nếu seller chưa gọi endAuction trên chain
      const expiredAuctions = await prisma.auctionMetadata.findMany({
        where: {
          status: 'ACTIVE',
          endTime: { lte: now },
        },
        include: {
          bids: {
            orderBy: { amountWei: 'desc' },
            take: 1,
            select: { bidderId: true, amountWei: true }
          }
        }
      });

      if (expiredAuctions.length > 0) {
        for (const auction of expiredAuctions) {
          const highestBid = auction.bids[0];
          const hasWinner = !!highestBid;

          await prisma.auctionMetadata.update({
            where: { id: auction.id },
            data: {
              status: 'ENDED',
              winnerId: highestBid?.bidderId ?? null,
              // Giữ escrowStatus là NONE cho đến khi endAuction được gọi trên chain
              // escrowStatus: hasWinner ? 'AWAITING_SHIPMENT' : 'REFUNDED',
            }
          });

          if (hasWinner) {
            // Đánh dấu bid thắng cuộc
            await prisma.bid.updateMany({
              where: {
                auctionId: auction.id,
                bidderId: highestBid.bidderId,
                amountWei: highestBid.amountWei,
              },
              data: { isWinning: true }
            });

            console.log(`[AuctionJob] Auto-ended auction: ${auction.title} - Winner: ${highestBid.bidderId}`);
            
            // Thông báo cho người thắng
            await notificationService.createNotification(highestBid.bidderId, {
              type: 'SUCCESS',
              title: 'Chúc mừng! Bạn đã thắng cuộc đấu giá',
              message: `Bạn đã thắng cuộc đấu giá "${auction.title}". Vui lòng kiểm tra Dashboard để tiến hành thanh toán phí vận chuyển (nếu có).`,
              actionUrl: `/auctions/${auction.id}`,
            });
          } else {
            console.log(`[AuctionJob] Auto-ended auction (No Bids): ${auction.title}`);
          }

          // Phát sự kiện AUCTION.ENDED
          eventEmitter.emit(Events.AUCTION.ENDED, {
            auctionId: auction.id,
            sellerId: auction.sellerId,
            title: auction.title,
            hasWinner,
          });
        }
      }

    } catch (error) {
      console.error('[AuctionJob] Error in status update job:', error);
    }
  }, 60 * 1000); // 1 minute
}
