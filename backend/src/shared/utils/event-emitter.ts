import { EventEmitter } from 'events';

/**
 * AppEventEmitter is a central event hub for the application.
 * It follows the Singleton pattern to ensure all parts of the app use the same emitter.
 */
class AppEventEmitter extends EventEmitter {
  private static instance: AppEventEmitter;

  private constructor() {
    super();
    // Increase max listeners if needed
    this.setMaxListeners(20);
  }

  public static getInstance(): AppEventEmitter {
    if (!AppEventEmitter.instance) {
      AppEventEmitter.instance = new AppEventEmitter();
    }
    return AppEventEmitter.instance;
  }
}

export const eventEmitter = AppEventEmitter.getInstance();

// Define Event Names as Constants for type safety and easy discovery
export const Events = {
  USER: {
    FOLLOWED: 'user.followed',
    PROFILE_UPDATED: 'user.profile_updated',
    ADDRESS_UPDATED: 'user.address_updated',
  },
  KYC: {
    STATUS_UPDATED: 'kyc.status_updated',
  },
  AUCTION: {
    CREATED: 'auction.created',
    STARTED: 'auction.started',
    ENDED: 'auction.ended',
    CANCELED: 'auction.canceled',
    FORFEITED: 'auction.forfeited',
  },
  BID: {
    PLACED: 'bid.placed',
    OUTBID: 'bid.outbid',
    WON: 'bid.won',
  },
  SHIPPING: {
    STATUS_UPDATED: 'shipping.status_updated',
  },
  CHAT: {
    MESSAGE_SENT: 'chat.message_sent',
  },
};
