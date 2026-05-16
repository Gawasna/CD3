'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MoreHorizontal, X, Send, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { chatApi, Conversation, Message, ChatParticipant } from '@/services/api/chat';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Avatar placeholder với gradient cam brand hoặc ảnh thực */
function Avatar({ src, size = 36 }: { src?: string | null; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt="Avatar"
        className="rounded-full flex-shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #FF8400 0%, #FF6B00 100%)',
      }}
    />
  );
}

/** Một item trong danh sách conversation */
function ConvItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const lastMsg = conv.lastMessage;
  const timeStr = lastMsg ? format(new Date(lastMsg.createdAt), 'HH:mm') : '';
  const isUnread = lastMsg && !lastMsg.isRead && lastMsg.senderId === conv.otherParticipant.id;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-left transition-colors ${
        isActive
          ? 'bg-[var(--color-secondary)]'
          : 'hover:bg-[var(--color-secondary)]/60'
      } border-t border-[var(--color-border)] first:border-t-0`}
    >
      <Avatar src={conv.otherParticipant.avatarUrl} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-[13px] truncate ${isUnread ? 'font-bold' : 'font-semibold'} text-[var(--color-foreground)]`}>
            {conv.otherParticipant.displayName || 
             (conv.otherParticipant.walletAddress ? 
              conv.otherParticipant.walletAddress.slice(0, 6) + '...' + conv.otherParticipant.walletAddress.slice(-4) : 
              'Người dùng ẩn danh')}
          </span>
          <span className="text-[11px] text-[var(--color-muted-foreground)] flex-shrink-0 ml-2">
            {timeStr}
          </span>
        </div>
        <p className={`text-[12px] truncate mt-0.5 ${isUnread ? 'text-[var(--color-foreground)] font-medium' : 'text-[var(--color-muted-foreground)]'}`}>
          {lastMsg?.content || 'Chưa có tin nhắn'}
        </p>
      </div>
      {isUnread ? (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--color-primary)]" />
      ) : null}
    </button>
  );
}

/** Bubble tin nhắn */
function MessageBubble({ message, currentUserId }: { message: Message; currentUserId: string }) {
  const isMe = message.senderId === currentUserId;
  const timeStr = format(new Date(message.createdAt), 'HH:mm');

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] px-3.5 py-2.5 text-[13px] leading-relaxed break-words ${
          isMe
            ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-[14px_14px_4px_14px]'
            : 'bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)] rounded-[14px_14px_14px_4px]'
        }`}
        style={{ fontFamily: 'var(--font-geist), sans-serif' }}
      >
        {message.content}
        <span
          className={`block text-[10px] mt-1 ${
            isMe
              ? 'text-[var(--color-primary-foreground)]/70 text-right'
              : 'text-[var(--color-muted-foreground)] text-right'
          }`}
        >
          {timeStr}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ChatDialogProps {
  onClose: () => void;
}

export default function ChatDialog({ onClose }: ChatDialogProps) {
  const { user } = useAuthStore();
  const { targetUserId } = useChatStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  
  // State cho hội thoại mới (chưa có trong list)
  const [newChatTarget, setNewChatTarget] = useState<ChatParticipant | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Conversations + Polling
  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const { conversations } = await chatApi.getConversations();
        setConversations(conversations);
        
        // Logic chọn hội thoại active
        if (targetUserId) {
          const existing = conversations.find(c => c.otherParticipant.id === targetUserId);
          if (existing) {
            setActiveConvId(existing.id);
            setNewChatTarget(null);
          } else if (!newChatTarget || newChatTarget.id !== targetUserId) {
            // Lấy thông tin user của targetUserId để hiển thị đúng tên
            try {
              const { user: targetUserInfo } = await chatApi.getUserInfo(targetUserId);
              setNewChatTarget(targetUserInfo);
            } catch (err) {
              console.error('Failed to fetch target user info:', err);
              setNewChatTarget({ id: targetUserId, displayName: 'Người dùng', avatarUrl: null, walletAddress: '' });
            }
            setActiveConvId(null);
            setMessages([]);
          }
        } else if (conversations.length > 0 && !activeConvId) {
          setActiveConvId(conversations[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setIsLoadingConvs(false);
      }
    };

    fetchConvs();
    const interval = setInterval(fetchConvs, 5000); // Polling 5s
    return () => clearInterval(interval);
  }, [activeConvId, targetUserId, newChatTarget]);

  // 2. Fetch Messages + Polling for active conversation
  useEffect(() => {
    if (!activeConvId) return;

    const fetchMsgs = async (showLoading = false) => {
      if (showLoading) setIsLoadingMsgs(true);
      try {
        const { messages } = await chatApi.getMessages(activeConvId);
        setMessages(messages);
        
        // Mark as read if there are unread messages from others
        const hasUnread = messages.some(m => !m.isRead && m.senderId !== user?.id);
        if (hasUnread) {
          await chatApi.markAsRead(activeConvId);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        if (showLoading) setIsLoadingMsgs(false);
      }
    };

    fetchMsgs(true);
    const interval = setInterval(() => fetchMsgs(false), 3000); // Polling tin nhắn nhanh hơn (3s)
    return () => clearInterval(interval);
  }, [activeConvId, user?.id]);

  // Cuộn xuống cuối mỗi khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input khi mở dialog hoặc đổi hội thoại
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConvId, targetUserId]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const headerUser = activeConv?.otherParticipant || newChatTarget;

  const filteredConvs = conversations.filter((c) => {
    const name = c.otherParticipant.displayName || c.otherParticipant.walletAddress;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !user) return;
    
    const receiverId = activeConv?.otherParticipant.id || targetUserId;
    if (!receiverId) return;

    try {
      const { message } = await chatApi.sendMessage(receiverId, text);
      setMessages((prev) => [...prev, message]);
      setInputValue('');
      
      // Nếu là tin nhắn đầu tiên của hội thoại mới
      if (!activeConvId) {
        setActiveConvId(message.conversationId);
        setNewChatTarget(null);
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return (
      <div className="w-[760px] h-[560px] bg-[var(--color-card)] rounded-2xl flex items-center justify-center border border-[var(--color-border)]">
        <p className="text-[var(--color-muted-foreground)]">Vui lòng đăng nhập để sử dụng chat</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 16 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ transformOrigin: 'bottom right' }}
      className="
        flex overflow-hidden
        w-[760px] h-[560px]
        bg-[var(--color-card)]
        rounded-2xl
        shadow-[0_8px_40px_rgba(0,0,0,0.16)]
        border border-[var(--color-border)]
      "
    >
      {/* ================================================================ */}
      {/* SIDEBAR                                                           */}
      {/* ================================================================ */}
      <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-background)]">
        {/* Header sidebar */}
        <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)] flex flex-col gap-2.5">
          <h2
            className="text-[18px] font-bold text-[var(--color-foreground)]"
            style={{ fontFamily: 'var(--font-jetbrains), monospace' }}
          >
            Tin nhắn
          </h2>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-secondary)]">
            <Search className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none"
              style={{ fontFamily: 'var(--font-geist), sans-serif' }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConvs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-muted-foreground)]" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <p className="text-center text-[12px] text-[var(--color-muted-foreground)] py-8">
              Không có cuộc hội thoại nào
            </p>
          ) : (
            filteredConvs.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConvId}
                onClick={() => setActiveConvId(conv.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ================================================================ */}
      {/* CHAT AREA                                                         */}
      {/* ================================================================ */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-card)]">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <Avatar src={headerUser?.avatarUrl} size={36} />
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[14px] font-bold text-[var(--color-foreground)]"
                style={{ fontFamily: 'var(--font-geist), sans-serif' }}
              >
                {headerUser?.displayName || 
                 (headerUser?.walletAddress ? 
                  headerUser.walletAddress.slice(0, 6) + '...' + headerUser.walletAddress.slice(-4) : 
                  '—')}
              </span>
              <div className="flex items-center gap-1">
                <span className="w-[7px] h-[7px] rounded-full bg-green-500 flex-shrink-0" />
                <span
                  className="text-[11px] text-green-500"
                  style={{ fontFamily: 'var(--font-geist), sans-serif' }}
                >
                  Trực tuyến
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onClose}
              title="Đóng chat"
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 px-4 py-5 bg-[var(--color-background)]">
          {isLoadingMsgs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-muted-foreground)]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
              <p className="text-[13px]">Bắt đầu cuộc trò chuyện ngay!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} currentUserId={user.id} />
            ))
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-3xl bg-[var(--color-background)] border border-[var(--color-border)]">
            <input
              ref={inputRef}
              type="text"
              placeholder="Nhập nội dung tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!activeConvId && !targetUserId}
              className="flex-1 bg-transparent text-[13px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none"
              style={{ fontFamily: 'var(--font-geist), sans-serif' }}
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim() || (!activeConvId && !targetUserId)}
            aria-label="Gửi tin nhắn"
            className="
              w-[38px] h-[38px] flex-shrink-0
              rounded-full
              bg-[var(--color-primary)] text-[var(--color-primary-foreground)]
              flex items-center justify-center
              transition-all
              hover:brightness-105 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
            "
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
