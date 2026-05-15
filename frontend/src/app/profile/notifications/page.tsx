"use client";

import React, { useState, useEffect } from 'react';
import { useNotificationStore, Notification } from '@/store/notification.store';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Check, Bell, Loader2, Info, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

type TabType = 'ALL' | 'UNREAD' | 'AUCTION' | 'SYSTEM';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'UNREAD') return !notif.isRead;
    if (activeTab === 'AUCTION') return notif.type === 'SUCCESS' || notif.type === 'WARNING';
    if (activeTab === 'SYSTEM') return notif.type === 'INFO' || notif.type === 'ERROR';
    return true;
  });

  const getIcon = (type: Notification['type'], isRead: boolean) => {
    const baseClass = "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0";
    
    switch (type) {
      case 'SUCCESS':
        return (
          <div className={`${baseClass} ${!isRead ? 'bg-[#DFE6E1]' : 'bg-[var(--color-secondary)]'}`}>
            <Check className={`w-6 h-6 ${!isRead ? 'text-[#004D1A]' : 'text-[var(--color-muted-foreground)]'}`} />
          </div>
        );
      case 'ERROR':
        return (
          <div className={`${baseClass} ${!isRead ? 'bg-red-100' : 'bg-[var(--color-secondary)]'}`}>
            <XCircle className={`w-6 h-6 ${!isRead ? 'text-red-700' : 'text-[var(--color-muted-foreground)]'}`} />
          </div>
        );
      case 'WARNING':
        return (
          <div className={`${baseClass} ${!isRead ? 'bg-orange-100' : 'bg-[var(--color-secondary)]'}`}>
            <AlertCircle className={`w-6 h-6 ${!isRead ? 'text-orange-700' : 'text-[var(--color-muted-foreground)]'}`} />
          </div>
        );
      case 'INFO':
      default:
        return (
          <div className={`${baseClass} ${!isRead ? 'bg-blue-100' : 'bg-[var(--color-secondary)]'}`}>
            <Bell className={`w-6 h-6 ${!isRead ? 'text-blue-700' : 'text-[var(--color-muted-foreground)]'}`} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[var(--color-background)] py-10 px-6 sm:px-12 md:px-24 lg:px-32 flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-8">
        
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-3xl font-bold text-[var(--color-foreground)]">
            Thông báo của tôi
          </h1>
          <button 
            onClick={markAllAsRead}
            className="text-sm font-medium text-[var(--color-primary)] hover:underline font-[family-name:var(--font-geist-sans)]"
          >
            Đánh dấu đã đọc tất cả
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[var(--color-border)] font-[family-name:var(--font-geist-sans)]">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'UNREAD', label: 'Chưa đọc' },
            { id: 'AUCTION', label: 'Đấu giá' },
            { id: 'SYSTEM', label: 'Hệ thống' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-2 text-base transition-all relative ${
                activeTab === tab.id 
                ? 'font-bold text-[var(--color-foreground)]' 
                : 'font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary)] animate-in fade-in slide-in-from-bottom-1" />
              )}
            </button>
          ))}
        </div>

        {/* Notification List Container */}
        <div className="bg-[var(--color-card)] rounded-[var(--radius-m,16px)] border border-[var(--color-border)] shadow-sm overflow-hidden flex flex-col">
          {isLoading && notifications.length === 0 ? (
            <div className="p-20 text-center text-[var(--color-muted-foreground)] flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 mb-4 animate-spin text-[var(--color-primary)]" />
              <p className="text-lg">Đang tải danh sách thông báo...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-20 text-center text-[var(--color-muted-foreground)] flex flex-col items-center justify-center">
              <Bell className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-lg">Không tìm thấy thông báo nào</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                  className={`p-6 flex gap-5 transition-colors cursor-pointer group hover:bg-[var(--color-secondary)]/30 ${
                    !notif.isRead ? 'bg-[var(--color-secondary)]/50' : 'bg-[var(--color-card)]'
                  }`}
                >
                  {getIcon(notif.type, notif.isRead)}
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className={`text-base leading-tight truncate ${
                        !notif.isRead ? 'font-bold text-[var(--color-foreground)]' : 'font-semibold text-[var(--color-foreground)]'
                      }`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap pt-0.5">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      !notif.isRead ? 'text-[var(--color-foreground)] font-medium' : 'text-[var(--color-muted-foreground)]'
                    }`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                          {notif.type === 'SUCCESS' || notif.type === 'WARNING' ? 'Đấu giá' : 'Hệ thống'}
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
