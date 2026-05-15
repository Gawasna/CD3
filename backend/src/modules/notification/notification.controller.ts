import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';

/**
 * Lấy danh sách thông báo của user hiện tại.
 */
export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await notificationService.listUserNotifications(req.user!.id, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Đánh dấu một thông báo là đã đọc.
 */
export async function patchMarkAsRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    await notificationService.markAsRead(req.user!.id, id);
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
}

/**
 * Đánh dấu tất cả thông báo là đã đọc.
 */
export async function patchMarkAllAsRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

/**
 * Xóa một thông báo.
 */
export async function deleteNotification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    await notificationService.deleteNotification(req.user!.id, id);
    res.status(200).json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
}
