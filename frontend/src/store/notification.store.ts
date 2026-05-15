import { create } from 'zustand';
import { notificationApi, NotificationResponse } from '@/services/api/notification';

export interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  actionUrl?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pollingInterval: NodeJS.Timeout | null;
  
  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  
  // Polling
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  
  // Browser Native Push
  pushPermission: NotificationPermission | 'default';
  requestPushPermission: () => Promise<void>;
  
  // Mock for demo (keep for now but can be triggered externally)
  mockReceiveNotification: () => void;
}

const mapResponseToNotification = (res: NotificationResponse): Notification => ({
  id: res.id,
  type: res.type,
  title: res.title,
  message: res.message,
  createdAt: new Date(res.createdAt),
  isRead: res.isRead,
  actionUrl: res.actionUrl || undefined,
});

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pollingInterval: null,
  
  fetchNotifications: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const data = await notificationApi.getNotifications(page, limit);
      set({
        notifications: data.items.map(mapResponseToNotification),
        unreadCount: data.unreadCount,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch notifications', isLoading: false });
    }
  },
  
  startPolling: (intervalMs = 60000) => {
    if (get().pollingInterval) return;
    
    const interval = setInterval(() => {
      get().fetchNotifications();
    }, intervalMs);
    
    set({ pollingInterval: interval as any });
  },
  
  stopPolling: () => {
    const interval = get().pollingInterval;
    if (interval) {
      clearInterval(interval as any);
      set({ pollingInterval: null });
    }
  },
  
  addNotification: (notification) => {
    // This is mainly for real-time updates when a socket event arrives
    const newNotif: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date(),
      isRead: false,
    };
    
    // Trigger browser native push notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const nativeNotif = new window.Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
        });
        
        nativeNotif.onclick = () => {
          window.focus();
          get().markAsRead(newNotif.id);
          nativeNotif.close();
        };
      }
    }

    set((state) => ({
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  
  markAsRead: async (id) => {
    // Optimistic update
    const previousNotifications = get().notifications;
    const previousUnreadCount = get().unreadCount;

    set((state) => {
      let readOccurred = false;
      const updated = state.notifications.map((n) => {
        if (n.id === id && !n.isRead) {
          readOccurred = true;
          return { ...n, isRead: true };
        }
        return n;
      });
      return {
        notifications: updated,
        unreadCount: readOccurred ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });

    try {
      await notificationApi.markAsRead(id);
    } catch (err) {
      // Rollback on error
      set({ notifications: previousNotifications, unreadCount: previousUnreadCount });
      console.error('Failed to mark notification as read:', err);
    }
  },
  
  markAllAsRead: async () => {
    const previousNotifications = get().notifications;
    const previousUnreadCount = get().unreadCount;

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));

    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      set({ notifications: previousNotifications, unreadCount: previousUnreadCount });
      console.error('Failed to mark all notifications as read:', err);
    }
  },
  
  removeNotification: async (id) => {
    const previousNotifications = get().notifications;
    const previousUnreadCount = get().unreadCount;

    // Optimistic update
    set((state) => {
      const notifToRemove = state.notifications.find((n) => n.id === id);
      const wasUnread = notifToRemove && !notifToRemove.isRead;
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });

    try {
      await notificationApi.deleteNotification(id);
    } catch (err) {
      set({ notifications: previousNotifications, unreadCount: previousUnreadCount });
      console.error('Failed to delete notification:', err);
    }
  },
  
  mockReceiveNotification: () => {
    const types: ('INFO' | 'SUCCESS' | 'WARNING' | 'ERROR')[] = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'];
    const type = types[Math.floor(Math.random() * types.length)];
    const messages = {
      INFO: 'Phiên đấu giá "Bình gốm cổ" sắp kết thúc trong 15 phút.',
      SUCCESS: 'Hồ sơ KYC của bạn đã được duyệt thành công!',
      WARNING: 'Có người vừa đặt giá cao hơn bạn trong phiên đấu giá.',
      ERROR: 'Hồ sơ KYC bị từ chối do hình ảnh CMT/CCCD bị mờ.',
    };
    get().addNotification({
      type,
      title: type === 'SUCCESS' ? 'Thành công' : type === 'ERROR' ? 'Lỗi hệ thống' : type === 'WARNING' ? 'Cảnh báo' : 'Thông báo',
      message: messages[type],
    });
  },
  
  pushPermission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
  
  requestPushPermission: async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        set({ pushPermission: permission });
        if (permission === 'granted') {
          new window.Notification('Đã bật thông báo', {
            body: 'Bạn sẽ nhận được các cập nhật quan trọng từ CD3.',
          });
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  },
}));

