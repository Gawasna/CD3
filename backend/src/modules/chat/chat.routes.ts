import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { sendMessageSchema, getMessagesSchema } from './chat.schema';
import * as chatController from './chat.controller';

const router = Router();

router.use(authenticate);

router.get('/users/:userId', chatController.getUserInfo);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId/messages', validate(getMessagesSchema, 'params'), chatController.getMessages);
router.post('/messages', validate(sendMessageSchema, 'body'), chatController.sendMessage);
router.patch('/conversations/:conversationId/read', chatController.markAsRead);

export default router;
