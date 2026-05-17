import { prisma } from '../../config/database';
import { NotificationType } from '@prisma/client';

/**
 * Service xử lý logic thông báo.
 */
export const notificationService = {
  /**
   * Tạo thông báo mới cho người dùng.
   * Hàm này được gọi từ các module khác (Auction, KYC, v.v.).
   */
  async createNotification(userId: string, data: {
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId,
        ...data,
      },
    });
  },

  /**
   * Lấy danh sách thông báo của người dùng với phân trang.
   */
  async listUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({
        where: { userId },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      unreadCount,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Đánh dấu một thông báo là đã đọc.
   */
  async markAsRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Đảm bảo đúng user sở hữu thông báo
      },
      data: {
        isRead: true,
      },
    });
  },

  /**
   * Đánh dấu tất cả thông báo của user là đã đọc.
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  },

  /**
   * Đếm số lượng thông báo chưa đọc của user.
   */
  async countUnread(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  },

  /**
   * Xóa thông báo (Optional).
   */
  async deleteNotification(userId: string, notificationId: string) {
    return prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  },
};
