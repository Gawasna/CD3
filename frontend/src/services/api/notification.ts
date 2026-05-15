'use client';

import { authFetch } from './client';

export interface NotificationResponse {
  id: string;
  userId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export const notificationApi = {
  /**
   * Lấy danh sách thông báo của người dùng hiện tại
   */
  getNotifications: async (page = 1, limit = 20): Promise<PaginatedNotifications> => {
    return authFetch<PaginatedNotifications>(`/v1/notifications?page=${page}&limit=${limit}`);
  },

  /**
   * Đánh dấu một thông báo là đã đọc
   */
  markAsRead: async (id: string): Promise<NotificationResponse> => {
    return authFetch<NotificationResponse>(`/v1/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead: async (): Promise<{ count: number }> => {
    return authFetch<{ count: number }>('/v1/notifications/read-all', {
      method: 'PATCH',
    });
  },

  /**
   * Xóa một thông báo
   */
  deleteNotification: async (id: string): Promise<{ success: boolean }> => {
    return authFetch<{ success: boolean }>(`/v1/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};
