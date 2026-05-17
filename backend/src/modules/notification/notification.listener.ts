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
        title: 'New Follower',
        message: `${followerName} is now following you!`,
        actionUrl: `/profile/${data.followerId}`,
      });
    });

    eventEmitter.on(Events.USER.ADDRESS_UPDATED, async (data) => {
      const { userId } = data;
      await notificationService.createNotification(userId, {
        type: NotificationType.WARNING,
        title: 'Security Alert',
        message: 'Your shipping address has been updated.',
      });
    });

    // --- KYC EVENTS ---
    eventEmitter.on(Events.KYC.STATUS_UPDATED, async (data) => {
      const { userId, status, reason } = data;
      let type = NotificationType.INFO;
      let title = 'KYC Update';
      let message = `Your KYC status has been updated to ${status}.`;

      if (status === 'PENDING') {
        type = NotificationType.INFO;
        title = 'KYC Received';
        message = 'We have received your KYC documents and are reviewing them.';
      } else if (status === 'APPROVED') {
        type = NotificationType.SUCCESS;
        title = 'KYC Approved';
        message = 'Congratulations! Your identity has been verified.';
      } else if (status === 'REJECTED') {
        type = NotificationType.ERROR;
        title = 'KYC Rejected';
        message = `Your KYC request was rejected. Reason: ${reason || 'N/A'}`;
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
        title: 'Auction Started',
        message: `Your auction "${title}" is now active!`,
        actionUrl: `/auctions/${auctionId}`,
      });

      // Notify Watchers
      if (watcherIds && watcherIds.length > 0) {
        for (const watcherId of watcherIds) {
          await notificationService.createNotification(watcherId, {
            type: NotificationType.INFO,
            title: 'Auction Active',
            message: `An auction you are watching "${title}" has started.`,
            actionUrl: `/auctions/${auctionId}`,
          });
        }
      }
    });

    // --- BID EVENTS ---
    eventEmitter.on(Events.BID.PLACED, async (data) => {
      const { auctionId, bidderId, amount, previousBidderId, title } = data;
      
      // Notify Bidder
      await notificationService.createNotification(bidderId, {
        type: NotificationType.SUCCESS,
        title: 'Bid Placed',
        message: `You successfully placed a bid of ${amount} on "${title}".`,
        actionUrl: `/auctions/${auctionId}`,
      });

      // Notify Previous Bidder (Outbid)
      if (previousBidderId && previousBidderId !== bidderId) {
        await notificationService.createNotification(previousBidderId, {
          type: NotificationType.WARNING,
          title: 'Outbid!',
          message: `Someone placed a higher bid on "${title}".`,
          actionUrl: `/auctions/${auctionId}`,
        });
      }
    });

    eventEmitter.on(Events.BID.WON, async (data) => {
      const { auctionId, winnerId, title, amount } = data;
      await notificationService.createNotification(winnerId, {
        type: NotificationType.SUCCESS,
        title: 'Auction Won!',
        message: `Congratulations! You won the auction "${title}" with a bid of ${amount}.`,
        actionUrl: `/auctions/${auctionId}`,
      });
    });

    // --- SHIPPING EVENTS ---
    eventEmitter.on(Events.SHIPPING.STATUS_UPDATED, async (data) => {
      const { auctionId, userId, status, title } = data;
      let message = `Shipping status for "${title}" updated to ${status}.`;
      
      await notificationService.createNotification(userId, {
        type: NotificationType.INFO,
        title: 'Shipping Update',
        message,
        actionUrl: `/orders/${auctionId}`,
      });
    });

    // --- CHAT EVENTS ---
    eventEmitter.on(Events.CHAT.MESSAGE_SENT, async (data) => {
      const { recipientId, senderName, content, conversationId } = data;
      await notificationService.createNotification(recipientId, {
        type: NotificationType.INFO,
        title: 'New Message',
        message: `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        actionUrl: `/chat/${conversationId}`,
      });
    });
  }
}
