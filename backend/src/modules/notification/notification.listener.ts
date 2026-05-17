import { eventEmitter, Events } from '../../shared/utils/event-emitter';
import { notificationService } from './notification.service';
import { NotificationType } from '@prisma/client';

/**
 * NotificationListener listens to application events and creates notifications.
 * This runs asynchronously to avoid blocking the main business flow.
 */
export class NotificationListener {
  public static register() {
    // --- USER EVENTS ---
    eventEmitter.on(Events.USER.FOLLOWED, async (data) => {
      const { followerName, followingId } = data;
      await notificationService.createNotification(followingId, {
        type: NotificationType.INFO,
        title: 'Người theo dõi mới',
        message: `${followerName} đã bắt đầu theo dõi bạn!`,
        actionUrl: `/profile/${data.followerId}`,
      });
    });

    eventEmitter.on(Events.USER.ADDRESS_UPDATED, async (data) => {
      const { userId } = data;
      await notificationService.createNotification(userId, {
        type: NotificationType.WARNING,
        title: 'Cảnh báo bảo mật',
        message: 'Địa chỉ giao hàng của bạn đã được cập nhật.',
      });
    });

    // --- KYC EVENTS ---
    eventEmitter.on(Events.KYC.STATUS_UPDATED, async (data) => {
      const { userId, status, reason } = data;
      let type: NotificationType = NotificationType.INFO;
      let title = 'Cập nhật KYC';
      let message = `Trạng thái KYC của bạn đã được cập nhật thành ${status}.`;

      if (status === 'PENDING') {
        type = NotificationType.INFO;
        title = 'Đã nhận hồ sơ KYC';
        message = 'Chúng tôi đã nhận được tài liệu KYC của bạn và đang tiến hành kiểm tra.';
      } else if (status === 'APPROVED') {
        type = NotificationType.SUCCESS;
        title = 'KYC đã được duyệt';
        message = 'Chúc mừng! Danh tính của bạn đã được xác minh thành công.';
      } else if (status === 'REJECTED') {
        type = NotificationType.ERROR;
        title = 'KYC bị từ chối';
        message = `Yêu cầu KYC của bạn bị từ chối. Lý do: ${reason || 'Không xác định'}`;
      }

      await notificationService.createNotification(userId, {
        type,
        title,
        message,
        actionUrl: '/kyc',
      });
    });

    // --- AUCTION EVENTS ---
    eventEmitter.on(Events.AUCTION.CREATED, async (data) => {
      // Typically no notification for the creator, but could notify followers
      // For now, let's keep it simple.
    });

    eventEmitter.on(Events.AUCTION.STARTED, async (data) => {
      const { auctionId, sellerId, title, watcherIds } = data;
      
      // Notify Seller
      await notificationService.createNotification(sellerId, {
        type: NotificationType.INFO,
        title: 'Phiên đấu giá bắt đầu',
        message: `Phiên đấu giá "${title}" của bạn hiện đã bắt đầu nhận giá!`,
        actionUrl: `/auctions/${auctionId}`,
      });

      // Notify Watchers
      if (watcherIds && watcherIds.length > 0) {
        for (const watcherId of watcherIds) {
          await notificationService.createNotification(watcherId, {
            type: NotificationType.INFO,
            title: 'Phiên đấu giá đang diễn ra',
            message: `Phiên đấu giá "${title}" mà bạn đang theo dõi đã bắt đầu.`,
            actionUrl: `/auctions/${auctionId}`,
          });
        }
      }
    });

    eventEmitter.on(Events.AUCTION.ENDED, async (data) => {
      const { auctionId, sellerId, title, hasWinner } = data;
      await notificationService.createNotification(sellerId, {
        type: hasWinner ? NotificationType.SUCCESS : NotificationType.INFO,
        title: hasWinner ? 'Đã bán thành công!' : 'Phiên đấu giá kết thúc',
        message: hasWinner 
          ? `Phiên đấu giá "${title}" đã có người thắng cuộc! Hãy chuẩn bị gửi hàng.`
          : `Phiên đấu giá "${title}" đã kết thúc mà không có lượt đặt giá nào.`,
        actionUrl: `/auctions/${auctionId}`,
      });
    });

    eventEmitter.on(Events.AUCTION.CANCELED, async (data) => {
      const { auctionId, sellerId, title } = data;
      await notificationService.createNotification(sellerId, {
        type: NotificationType.INFO,
        title: 'Đã hủy phiên đấu giá',
        message: `Phiên đấu giá "${title}" của bạn đã được hủy thành công.`,
        actionUrl: `/auctions/${auctionId}`,
      });
    });

    eventEmitter.on(Events.AUCTION.FORFEITED, async (data) => {
      const { auctionId, sellerId, winnerId, title, penalty } = data;
      
      // Notify Seller
      await notificationService.createNotification(sellerId, {
        type: NotificationType.ERROR,
        title: 'Người thắng từ bỏ quyền mua',
        message: `Người thắng cuộc của "${title}" đã từ bỏ quyền mua. Bạn nhận được khoản bồi thường ${penalty} ETH.`,
        actionUrl: `/auctions/${auctionId}`,
      });

      // Notify Winner
      if (winnerId) {
        await notificationService.createNotification(winnerId, {
          type: NotificationType.WARNING,
          title: 'Đã từ bỏ quyền mua',
          message: `Bạn đã từ bỏ quyền mua cho "${title}". Khoản phí phạt ${penalty} ETH đã được khấu trừ.`,
          actionUrl: `/auctions/${auctionId}`,
        });
      }
    });

    // --- BID EVENTS ---
    eventEmitter.on(Events.BID.PLACED, async (data) => {
      const { auctionId, bidderId, amount, previousBidderId, title } = data;
      
      // Notify Bidder
      await notificationService.createNotification(bidderId, {
        type: NotificationType.SUCCESS,
        title: 'Đặt giá thành công',
        message: `Bạn đã đặt giá thành công ${amount} cho "${title}".`,
        actionUrl: `/auctions/${auctionId}`,
      });

      // Notify Previous Bidder (Outbid)
      if (previousBidderId && previousBidderId !== bidderId) {
        await notificationService.createNotification(previousBidderId, {
          type: NotificationType.WARNING,
          title: 'Bị đặt giá cao hơn!',
          message: `Ai đó đã đặt giá cao hơn bạn cho phiên đấu giá "${title}".`,
          actionUrl: `/auctions/${auctionId}`,
        });
      }
    });

    eventEmitter.on(Events.BID.WON, async (data) => {
      const { auctionId, winnerId, title, amount } = data;
      await notificationService.createNotification(winnerId, {
        type: NotificationType.SUCCESS,
        title: 'Thắng đấu giá!',
        message: `Chúc mừng! Bạn đã thắng phiên đấu giá "${title}" với mức giá ${amount}.`,
        actionUrl: `/auctions/${auctionId}`,
      });
    });

    // --- SHIPPING EVENTS ---
    eventEmitter.on(Events.SHIPPING.STATUS_UPDATED, async (data) => {
      const { auctionId, userId, status, title, feeEth } = data;
      let message = `Trạng thái vận chuyển cho "${title}" đã cập nhật thành ${status}.`;
      
      if (status === 'FEE_ESTIMATED') {
        message = `Phí vận chuyển cho "${title}" đã được ước tính là ${feeEth} ETH.`;
      }

      await notificationService.createNotification(userId, {
        type: NotificationType.INFO,
        title: 'Cập nhật vận chuyển',
        message,
        actionUrl: `/orders/${auctionId}`,
      });
    });

    // --- CHAT EVENTS ---
    eventEmitter.on(Events.CHAT.MESSAGE_SENT, async (data) => {
      const { recipientId, senderName, content, conversationId } = data;
      await notificationService.createNotification(recipientId, {
        type: NotificationType.INFO,
        title: 'Tin nhắn mới',
        message: `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        actionUrl: `/chat/${conversationId}`,
      });
    });
  }
}
