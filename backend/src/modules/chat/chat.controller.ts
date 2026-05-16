import { Request, Response, NextFunction } from 'express';
import * as chatService from './chat.service';
import { SendMessageInput } from './chat.schema';

export async function getUserInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params as { userId: string };
    const user = await chatService.getUserChatInfo(userId);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function getConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const conversations = await chatService.getConversations(req.user!.id);
    res.status(200).json({ conversations });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const { conversationId } = req.params as { conversationId: string };
    const messages = await chatService.getMessages(conversationId, req.user!.id);
    res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(
  req: Request<unknown, unknown, SendMessageInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { receiverId, content } = req.body;
    const message = await chatService.sendMessage(req.user!.id, receiverId, content);
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { conversationId } = req.params as { conversationId: string };
    await chatService.markAsRead(conversationId, req.user!.id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}
