'use client';

import Link from 'next/link';
import { Box, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import ConnectWalletButton from './auth/ConnectWalletButton';
import UserProfileDropdown from './auth/UserProfileDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import { useWalletAuth } from '@/hooks/useWalletAuth';

export default function Header() {
  const t = useTranslations('common.header');
  const { openConnectModal } = useConnectModal();

  const {
    isReady,
    address,
    isConnected,
    isAuthenticated,
    isSigning,
    user,
    signIn,
    signOut,
  } = useWalletAuth();

  // Nếu ví đã connect nhưng chưa sign → hiển thị "Sign In" thay vì "Connect Wallet"
  const handleButtonClick = () => {
    if (!isConnected) {
      openConnectModal?.();
    } else if (!isAuthenticated) {
      signIn();
    }
  };

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <header className="flex items-center justify-between h-[72px] px-8 bg-[#F2F3F0] border-b border-[#CBCCC9]">
      <div className="flex items-center gap-3">
        <Box className="w-8 h-8 text-[#FF8400]" />
        <Link href="/" className="font-jetbrains text-[22px] font-extrabold tracking-wide text-[#111111]">
          {t('brand')}
        </Link>
      </div>

      <div className="flex items-center gap-2 h-10 px-4 rounded-full border border-[#CBCCC9] w-[400px]">
        <Search className="w-5 h-5 text-[#666666]" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="bg-transparent border-none outline-none w-full font-geist text-sm text-[#111111] placeholder:text-[#666666]"
        />
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {!isReady ? (
          <div className="h-14 w-[180px] bg-gray-200/50 animate-pulse rounded-full" />
        ) : isAuthenticated && user ? (
          <UserProfileDropdown
            address={user.walletAddress}
            user={user}
            onDisconnect={signOut}
          />
        ) : (
          <ConnectWalletButton
            onClick={handleButtonClick}
            loading={isSigning}
            // Hiển thị "Sign In" nếu ví đã connect nhưng chưa auth
            label={isConnected && !isAuthenticated ? 'Sign In' : undefined}
          />
        )}
      </div>
    </header>
  );
}
