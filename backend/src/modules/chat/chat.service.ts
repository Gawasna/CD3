import { prisma } from '../../config/database';
import { ApiError } from '../../shared/utils/api-error';
import { Message } from '@prisma/client';
import { eventEmitter, Events } from '../../shared/utils/event-emitter';

export interface ChatParticipant {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress: string;
}

export interface ConversationWithDetails {
  id: string;
  participant1Id: string;
  participant2Id: string;
  updatedAt: Date;
  participant1: ChatParticipant;
  participant2: ChatParticipant;
  messages: Message[];
}

export async function getUserChatInfo(userId: string): Promise<ChatParticipant> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      walletAddress: true,
    },
  });

  if (!user) {
    throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
  }

  return user;
}

export async function getConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { participant1Id: userId },
        { participant2Id: userId },
      ],
    },
    include: {
      participant1: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          walletAddress: true,
        },
      },
      participant2: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          walletAddress: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  }) as unknown as ConversationWithDetails[];

  return conversations.map((conv) => {
    const otherParticipant = conv.participant1Id === userId ? conv.participant2 : conv.participant1;
    const lastMessage = conv.messages[0] || null;
    return {
      id: conv.id,
      otherParticipant,
      lastMessage,
      updatedAt: conv.updatedAt,
    };
  });
}

export async function getMessages(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
  }

  if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
    throw ApiError.forbidden('NOT_PARTICIPANT', 'You are not a participant in this conversation');
  }

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  if (senderId === receiverId) {
    throw ApiError.badRequest('INVALID_RECEIVER', 'You cannot send a message to yourself');
  }

  // Ensure receiver exists
  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    throw ApiError.notFound('RECEIVER_NOT_FOUND', 'Receiver not found');
  }

  // Consistent participant ordering for unique constraint
  const participants = [senderId, receiverId].sort();
  const participant1Id = participants[0];
  const participant2Id = participants[1];

  let conversation = await prisma.conversation.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id,
        participant2Id,
      },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        participant1Id,
        participant2Id,
      },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      content,
    },
  });

  // Emit event để hệ thống Notification xử lý (Asynchronous)
  const sender = await prisma.user.findUnique({ where: { id: senderId } });
  eventEmitter.emit(Events.CHAT.MESSAGE_SENT, {
    recipientId: receiverId,
    senderId: senderId,
    senderName: sender?.displayName || 'Ai đó',
    content: content,
    conversationId: conversation.id,
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      conversation: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      senderId: { not: userId },
      isRead: false,
    },
  });
}

export async function markAsRead(conversationId: string, userId: string) {
  // Mark all unread messages from the other participant as read
  return prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });
}
