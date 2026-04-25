'use client';

import { CheckCircle, AlertTriangle, WifiOff, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'network';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-[#DFE6E1]',
      borderColor: 'border-[#004D1A]',
      textColor: 'text-[#004D1A]',
      iconColor: 'text-[#004D1A]',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-[#E9E3D8]',
      borderColor: 'border-[#804200]',
      textColor: 'text-[#804200]',
      iconColor: 'text-[#804200]',
    },
    error: {
      icon: X,
      bgColor: 'bg-[#E9E3D8]',
      borderColor: 'border-[#804200]',
      textColor: 'text-[#804200]',
      iconColor: 'text-[#804200]',
    },
    network: {
      icon: WifiOff,
      bgColor: 'bg-[#E9E3D8]',
      borderColor: 'border-[#804200]',
      textColor: 'text-[#804200]',
      iconColor: 'text-[#804200]',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div className={`flex items-center gap-3 w-[400px] p-4 ${bgColor} border ${borderColor} rounded-2xl shadow-lg animate-slide-in-right`}>
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
      <p className={`font-geist text-sm font-medium ${textColor} flex-1`}>
        {message}
      </p>
      <button
        onClick={onClose}
        className={`${iconColor} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
