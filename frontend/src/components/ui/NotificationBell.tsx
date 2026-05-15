'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, XCircle, Check, X, Bug, Loader2, RefreshCcw } from 'lucide-react';
import { useNotificationStore, Notification } from '@/store/notification.store';
import { useAuthStore } from '@/store/auth.store';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    startPolling,
    stopPolling,
    markAsRead,
    markAllAsRead,
    removeNotification,
    mockReceiveNotification,
    pushPermission,
    requestPushPermission
  } = useNotificationStore();

  const { token, status } = useAuthStore();

  // Initial fetch and start polling when authenticated
  useEffect(() => {
    if (status === 'authenticated' || token) {
      fetchNotifications();
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [status, token, fetchNotifications, startPolling, stopPolling]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'INFO':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    
    if (notif.actionUrl) {
      setIsOpen(false);
      router.push(notif.actionUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-200/50 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-[#111111]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-[#F2F3F0]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-[400px] bg-[var(--color-card)] rounded-[var(--radius-m,16px)] shadow-xl border border-[var(--color-border)] z-50 overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h3 className="font-bold text-[var(--color-foreground)] font-[family-name:var(--font-primary,var(--font-jetbrains))] text-lg">Thông báo</h3>
            <div className="flex items-center gap-3">
              {/* Refresh button */}
              <button 
                onClick={() => fetchNotifications()}
                disabled={isLoading}
                title="Làm mới thông báo"
                className="p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)] rounded-md disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              </button>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-[var(--color-primary)] hover:underline font-[family-name:var(--font-secondary,var(--font-geist))]"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 font-[family-name:var(--font-secondary,var(--font-geist))]">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-muted-foreground)] flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 mb-2 animate-spin text-[var(--color-primary)]" />
                <p>Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-muted-foreground)] flex flex-col items-center justify-center">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-[var(--color-secondary)] transition-colors relative group cursor-pointer ${
                      !notif.isRead ? 'bg-[var(--color-secondary)]' : 'bg-[var(--color-card)]'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          !notif.isRead ? 'bg-[#DFE6E1]' : 'bg-[var(--color-secondary)]'
                        }`}>
                          {notif.type === 'SUCCESS' ? (
                            <Check className={`w-5 h-5 ${!notif.isRead ? 'text-[#004D1A]' : 'text-[var(--color-muted-foreground)]'}`} />
                          ) : (
                            <Bell className="w-5 h-5 text-[var(--color-muted-foreground)]" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 pr-6">
                        <div className="flex flex-col gap-1">
                          <h4
                            className={`text-sm ${
                              !notif.isRead ? 'font-bold text-[var(--color-foreground)]' : 'font-medium text-[var(--color-foreground)]'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <p className="text-sm text-[var(--color-muted-foreground)] leading-tight">
                            {notif.message}
                          </p>
                          <span className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete button (shows on hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      className="absolute top-4 right-4 text-[var(--color-muted-foreground)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Xóa thông báo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--color-border)] flex justify-center">
             <button 
               className="text-sm font-semibold text-[var(--color-primary)] hover:underline font-[family-name:var(--font-secondary,var(--font-geist))]"
               onClick={() => {
                 setIsOpen(false);
                 router.push('/profile/notifications');
               }}
             >
               Xem tất cả thông báo
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
