import { create } from 'zustand';

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
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  mockReceiveNotification: () => void; // for demo
  pushPermission: NotificationPermission | 'default';
  requestPushPermission: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    // Pre-populate with some initial mock data
    {
      id: 'mock-1',
      type: 'INFO',
      title: 'Chào mừng',
      message: 'Chào mừng bạn đến với sàn đấu giá CD3. Vui lòng hoàn tất KYC để bắt đầu.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      isRead: false,
    }
  ],
  unreadCount: 1,
  
  addNotification: (notification) => {
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
          icon: '/favicon.ico', // Update with your actual icon path if available
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
  
  markAsRead: (id) => {
    set((state) => {
      let readCount = 0;
      const updated = state.notifications.map((n) => {
        if (n.id === id && !n.isRead) {
          readCount++;
          return { ...n, isRead: true };
        }
        return n;
      });
      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - readCount),
      };
    });
  },
  
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
  
  removeNotification: (id) => {
    set((state) => {
      const notifToRemove = state.notifications.find((n) => n.id === id);
      const wasUnread = notifToRemove && !notifToRemove.isRead;
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
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
          // Send a welcome native notification to confirm it works
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
