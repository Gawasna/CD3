'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatDialog from './ChatDialog';

import { useChatStore } from '@/store/chat.store';

/**
 * ChatWidget - FAB tròn góc dưới phải, toggle ChatDialog.
 * Mount component này trong layout.tsx để hiển thị toàn cục.
 */
export default function ChatWidget() {
  const { isOpen, setIsOpen, closeChat } = useChatStore();
  const [unreadCount] = useState(0); // TODO: Lấy từ API nếu cần

  const widgetRef = useRef<HTMLDivElement>(null);

  // Đóng dialog khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        closeChat();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, closeChat]);

  // Đóng dialog khi nhấn Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeChat();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [closeChat]);

  return (
    // Wrapper: fixed, bottom-right, z-index cao để luôn nổi trên content
    <div
      ref={widgetRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
    >
      {/* ---------------------------------------------------------------- */}
      {/* Chat Dialog - animate in/out                                      */}
      {/* ---------------------------------------------------------------- */}
      <AnimatePresence>
        {isOpen && (
          <ChatDialog onClose={closeChat} />
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------- */}
      {/* FAB - Floating Action Button                                      */}
      {/* ---------------------------------------------------------------- */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="
          relative
          w-14 h-14
          rounded-full
          bg-[var(--color-primary)]
          text-[var(--color-primary-foreground)]
          flex items-center justify-center
          shadow-[0_4px_24px_rgba(255,132,0,0.45)]
          transition-shadow
          hover:shadow-[0_6px_32px_rgba(255,132,0,0.55)]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2
        "
      >
        {/* Icon chuyển đổi mượt giữa MessageSquare và X */}
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge số tin chưa đọc - ẩn khi dialog đang mở */}
        <AnimatePresence>
          {!isOpen && unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="
                absolute -top-1 -right-1
                w-5 h-5
                rounded-full
                bg-red-500 text-white
                text-[10px] font-bold
                flex items-center justify-center
                border-2 border-[var(--color-background)]
              "
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
