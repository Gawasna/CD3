import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import {
  getNotifications,
  getUnreadCount,
  patchMarkAsRead,
  patchMarkAllAsRead,
  deleteNotification,
} from './notification.controller';

const router = Router();

// Tất cả route trong module này đều yêu cầu authenticate
router.use(authenticate);

// GET /api/v1/notifications
router.get('/', getNotifications);

// GET /api/v1/notifications/unread-count
router.get('/unread-count', getUnreadCount);

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', patchMarkAllAsRead);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', patchMarkAsRead);

// DELETE /api/v1/notifications/:id
router.delete('/:id', deleteNotification);

export default router;
