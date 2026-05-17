'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionDialogProps {
  isOpen: boolean;
  status: 'uploading' | 'waiting_wallet' | 'confirming' | 'finalizing' | 'error' | 'success';
  error?: string;
  onRetry: () => void;
  onClose: () => void;
}

export default function TransactionDialog({
  isOpen,
  status,
  error,
  onRetry,
  onClose
}: TransactionDialogProps) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && (status === 'waiting_wallet' || status === 'uploading')) {
      setTimeLeft(30);
      setIsTimedOut(false);
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimedOut(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, status]);

  // Reset timer if status changes to confirmed or finalized
  useEffect(() => {
    if (status === 'confirming' || status === 'finalizing' || status === 'success') {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimedOut(false);
    }
  }, [status]);

  if (!isOpen) return null;

  const getStatusContent = () => {
    switch (status) {
      case 'uploading':
        return {
          title: 'Uploading Media',
          description: 'Securely uploading your files to our servers...',
          icon: <Loader2 className="w-12 h-12 text-[#FF8400] animate-spin" />,
        };
      case 'waiting_wallet':
        return {
          title: 'Action Required',
          description: 'Please confirm the transaction in your wallet.',
          icon: (
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-[#FF8400] animate-spin" />
              <span className="absolute font-jetbrains text-xs font-bold text-[#FF8400]">
                {timeLeft}s
              </span>
            </div>
          ),
        };
      case 'confirming':
        return {
          title: 'Confirming',
          description: 'Transaction submitted. Waiting for blockchain confirmation...',
          icon: <Loader2 className="w-12 h-12 text-[#FF8400] animate-spin" />,
        };
      case 'finalizing':
        return {
          title: 'Finalizing',
          description: 'Registering your auction in our system...',
          icon: <Loader2 className="w-12 h-12 text-[#FF8400] animate-spin" />,
        };
      case 'error':
        return {
          title: 'Transaction Failed',
          description: error || 'Something went wrong. Please try again.',
          icon: <AlertCircle className="w-12 h-12 text-red-500" />,
        };
      case 'success':
        return {
          title: 'Success!',
          description: 'Your auction has been created successfully.',
          icon: <CheckCircle2 className="w-12 h-12 text-green-500" />,
        };
    }
  };

  const content = getStatusContent();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white border border-[#CBCCC9] rounded-[32px] p-8 w-full max-w-[440px] shadow-2xl relative overflow-hidden"
        >
          {/* Close button - only for error or success */}
          {(status === 'error' || status === 'success' || isTimedOut) && (
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F2F3F0] transition-colors"
            >
              <X className="w-5 h-5 text-[#666666]" />
            </button>
          )}

          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-[#F2F3F0] flex items-center justify-center mb-2">
              {content.icon}
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="font-jetbrains text-2xl font-extrabold text-[#111111]">
                {content.title}
              </h3>
              <p className="font-geist text-base text-[#666666] leading-relaxed">
                {content.description}
              </p>
            </div>

            {/* Timeout / Error Action */}
            {(isTimedOut && status === 'waiting_wallet') ? (
              <div className="flex flex-col gap-4 w-full mt-4">
                <div className="p-4 bg-[#FFF3CD] border border-[#FFC107] rounded-2xl flex items-start gap-3 text-left">
                  <AlertCircle className="w-5 h-5 text-[#856404] flex-shrink-0 mt-0.5" />
                  <p className="font-geist text-sm text-[#856404]">
                    Transaction request might have expired. If you haven't signed in your wallet, please try again.
                  </p>
                </div>
                <button
                  onClick={onRetry}
                  className="w-full h-12 bg-[#FF8400] rounded-full font-jetbrains font-bold text-[#111111] hover:opacity-90 transition-opacity"
                >
                  Try Again
                </button>
              </div>
            ) : status === 'error' ? (
              <button
                onClick={onRetry}
                className="w-full h-12 bg-[#FF8400] rounded-full font-jetbrains font-bold text-[#111111] hover:opacity-90 transition-opacity mt-4"
              >
                Try Again
              </button>
            ) : null}
          </div>

          {/* Bottom Progress Bar - only during active stages */}
          {!isTimedOut && status !== 'error' && status !== 'success' && (
            <div className="absolute bottom-0 left-0 h-1 bg-[#FF8400] transition-all duration-300" 
                 style={{ width: status === 'uploading' ? '25%' : status === 'waiting_wallet' ? '50%' : status === 'confirming' ? '75%' : '95%' }} 
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
