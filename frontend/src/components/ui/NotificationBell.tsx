'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, XCircle, Check, X, Bug } from 'lucide-react';
import { useNotificationStore, Notification } from '@/store/notification.store';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    mockReceiveNotification,
    pushPermission,
    requestPushPermission
  } = useNotificationStore();

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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-800">Thông báo</h3>
            <div className="flex items-center gap-2">
              {/* Nút giả lập nhận thông báo (chỉ dùng cho dev/demo) */}
              <button 
                onClick={mockReceiveNotification}
                title="Giả lập nhận thông báo (Demo)"
                className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
              >
                <Bug className="w-4 h-4" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Đánh dấu đã đọc tất cả
                </button>
              )}
            </div>
          </div>

          {/* Permission Banner */}
          {pushPermission !== 'granted' && pushPermission !== 'denied' && (
            <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-start justify-between">
              <div className="flex gap-2">
                <Bell className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Bật thông báo đẩy</p>
                  <p className="text-blue-700 text-xs mt-0.5">Không bỏ lỡ các cập nhật quan trọng</p>
                </div>
              </div>
              <button 
                onClick={requestPushPermission}
                className="text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-md hover:bg-blue-700 transition-colors font-medium whitespace-nowrap ml-2"
              >
                Bật
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={`p-4 hover:bg-gray-50 transition-colors relative group ${
                      !notif.isRead ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>
                      <div className="flex-1 pr-6">
                        <div className="flex justify-between items-start mb-1">
                          <h4
                            className={`text-sm ${
                              !notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                          </span>
                        </div>
                        <p className={`text-sm ${!notif.isRead ? 'text-gray-800' : 'text-gray-500'}`}>
                          {notif.message}
                        </p>
                        
                        {!notif.isRead && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs text-blue-600 font-medium mt-2 hover:underline inline-block"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete button (shows on hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Xóa thông báo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    {/* Unread dot indicator */}
                    {!notif.isRead && (
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-full bg-blue-500 rounded-r-full" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
