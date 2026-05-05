'use client';

import { Wallet } from 'lucide-react';

interface ConnectWalletButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Label tùy chỉnh — mặc định "Connect Wallet", có thể đổi thành "Sign In" */
  label?: string;
}

export default function ConnectWalletButton({
  onClick,
  disabled = false,
  loading = false,
  label = 'Connect Wallet',
}: ConnectWalletButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center justify-center gap-2 h-14 px-6 bg-[#FF8400] rounded-full text-[#111111] font-jetbrains text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
          <span>Signing...</span>
        </>
      ) : (
        <>
          <Wallet className="w-6 h-6" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
