'use client';

import { authFetch } from './client';

export interface ChatParticipant {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress: string;
}

export interface LastMessage {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId: string;
}

export interface Conversation {
  id: string;
  otherParticipant: ChatParticipant;
  lastMessage: LastMessage | null;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const chatApi = {
  getUserInfo: (userId: string) => authFetch<{ user: ChatParticipant }>(`/v1/chat/users/${userId}`),

  getConversations: () => authFetch<{ conversations: Conversation[] }>('/v1/chat/conversations'),

  getUnreadCount: () => authFetch<{ count: number }>('/v1/chat/unread-count'),

  getMessages: (conversationId: string) =>
    authFetch<{ messages: Message[] }>(`/v1/chat/conversations/${conversationId}/messages`),

  sendMessage: (receiverId: string, content: string) =>
    authFetch<{ message: Message }>('/v1/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content }),
    }),

  markAsRead: (conversationId: string) =>
    authFetch<{ success: boolean }>(`/v1/chat/conversations/${conversationId}/read`, {
      method: 'PATCH',
    }),
};
