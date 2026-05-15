'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MoreHorizontal, X, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread?: number;
  active?: boolean;
}

interface Message {
  id: string;
  role: 'bot' | 'user';
  content: string;
  time: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'inkspire_3d',
    preview: 'Đen ạ',
    time: '22:18',
    active: true,
  },
  {
    id: '2',
    name: 'Topick Global',
    preview: 'Hôm nay top 50 sản phẩm...',
    time: 'Hôm qua',
  },
  {
    id: '3',
    name: 'top1k.sale',
    preview: 'TỔNG HỢP...',
    time: 'Thứ 3',
  },
  {
    id: '4',
    name: 'maytinhvietnhat',
    preview: 'Là sao ạ',
    time: '09/04',
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'bot',
    content: 'Xin chào! Bạn cần hỗ trợ gì ạ?',
    time: '22:00',
  },
  {
    id: 'm2',
    role: 'user',
    content: 'Đen ạ',
    time: '22:18',
  },
  {
    id: 'm3',
    role: 'bot',
    content: 'Dạ, bạn có thể xem chi tiết đơn hàng trong mục "Quản lý đơn hàng" nhé!',
    time: '22:19',
  },
  {
    id: 'm4',
    role: 'user',
    content: 'Cảm ơn bạn nhiều!',
    time: '22:20',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Avatar placeholder với gradient cam brand */
function Avatar({ size = 36 }: { size?: number }) {
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
      <Avatar size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--color-foreground)] truncate">
            {conv.name}
          </span>
          <span className="text-[11px] text-[var(--color-muted-foreground)] flex-shrink-0 ml-2">
            {conv.time}
          </span>
        </div>
        <p className="text-[12px] text-[var(--color-muted-foreground)] truncate mt-0.5">
          {conv.preview}
        </p>
      </div>
      {conv.unread && conv.unread > 0 ? (
        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-[10px] font-bold flex items-center justify-center">
          {conv.unread}
        </span>
      ) : null}
    </button>
  );
}

/** Bubble tin nhắn */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] px-3.5 py-2.5 text-[13px] leading-relaxed break-words ${
          isUser
            ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-[14px_14px_4px_14px]'
            : 'bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)] rounded-[14px_14px_14px_4px]'
        }`}
        style={{ fontFamily: 'var(--font-geist), sans-serif' }}
      >
        {message.content}
        <span
          className={`block text-[10px] mt-1 ${
            isUser
              ? 'text-[var(--color-primary-foreground)]/70 text-right'
              : 'text-[var(--color-muted-foreground)] text-right'
          }`}
        >
          {message.time}
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
  const [activeConvId, setActiveConvId] = useState<string>('1');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cuộn xuống cuối mỗi khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input khi mở dialog
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const activeConv = MOCK_CONVERSATIONS.find((c) => c.id === activeConvId);

  const filteredConvs = MOCK_CONVERSATIONS.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'unread' && (c.unread ?? 0) > 0);
    return matchSearch && matchFilter;
  });

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: Message = {
      id: `m${Date.now()}`,
      role: 'user',
      content: text,
      time,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');

    // Mock bot reply sau 800ms
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m${Date.now()}-bot`,
          role: 'bot',
          content: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
          time,
        },
      ]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 16 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      // Origin góc dưới phải - khớp với vị trí FAB
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

          {/* Filter pills */}
          <div className="flex gap-1.5">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-full text-[12px] font-semibold transition-colors ${
                  filter === f
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
                style={{ fontFamily: 'var(--font-geist), sans-serif' }}
              >
                {f === 'all' ? 'Tất cả' : 'Chưa đọc'}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <p className="text-center text-[12px] text-[var(--color-muted-foreground)] py-8">
              Không tìm thấy
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
            <Avatar size={36} />
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[14px] font-bold text-[var(--color-foreground)]"
                style={{ fontFamily: 'var(--font-geist), sans-serif' }}
              >
                {activeConv?.name ?? '—'}
              </span>
              <div className="flex items-center gap-1">
                <span className="w-[7px] h-[7px] rounded-full bg-green-500 flex-shrink-0" />
                <span
                  className="text-[11px] text-green-500"
                  style={{ fontFamily: 'var(--font-geist), sans-serif' }}
                >
                  Đang hoạt động
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <button
              type="button"
              title="Tìm kiếm trong cuộc trò chuyện"
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              title="Tuỳ chọn thêm"
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <MoreHorizontal className="w-[18px] h-[18px]" />
            </button>
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
          {/* Timestamp separator */}
          <div className="flex justify-center">
            <span
              className="text-[11px] text-[var(--color-muted-foreground)]"
              style={{ fontFamily: 'var(--font-geist), sans-serif' }}
            >
              Thứ 4, 22:00
            </span>
          </div>

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

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
              className="flex-1 bg-transparent text-[13px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none"
              style={{ fontFamily: 'var(--font-geist), sans-serif' }}
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim()}
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
