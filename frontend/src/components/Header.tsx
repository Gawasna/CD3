'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Box, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import ConnectWalletButton from './auth/ConnectWalletButton';
import UserProfileDropdown from './auth/UserProfileDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './ui/NotificationBell';
import SearchDropdown from './shared/SearchDropdown';
import { useWalletAuth } from '@/hooks/useWalletAuth';

export default function Header() {
  const t = useTranslations('common.header');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { openConnectModal } = useConnectModal();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

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

  // Sync search value with URL when it changes elsewhere
  useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Nếu đang ở trang explore, cập nhật URL ngay lập tức (debounce sẽ xử lý ở page explore)
    if (pathname === '/explore' || pathname === '/vi/explore' || pathname === '/en/explore') {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsSearchOpen(false);
      if (pathname !== '/explore' && !pathname.endsWith('/explore')) {
        router.push(`/explore?search=${encodeURIComponent(searchValue)}`);
      }
    }
  };

  const handleButtonClick = () => {
    if (!isConnected) {
      openConnectModal?.();
    } else if (!isAuthenticated) {
      signIn();
    }
  };

  return (
    <header className="flex items-center justify-between h-[72px] px-8 bg-[#F2F3F0] border-b border-[#CBCCC9] sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Box className="w-8 h-8 text-[#FF8400]" />
        <Link href="/" className="font-jetbrains text-[22px] font-extrabold tracking-wide text-[#111111]">
          {t('brand')}
        </Link>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 h-10 px-4 rounded-full border border-[#CBCCC9] w-[400px] bg-white/50 focus-within:bg-white focus-within:border-[#FF8400] transition-all">
          <Search className="w-5 h-5 text-[#666666]" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('searchPlaceholder')}
            className="bg-transparent border-none outline-none w-full font-geist text-sm text-[#111111] placeholder:text-[#666666]"
            onFocus={() => setIsSearchOpen(true)}
          />
        </div>
        <SearchDropdown
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          searchQuery={searchValue}
        />
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />
        <LanguageSwitcher />
        {!isReady ? (
          <div className="h-10 w-[140px] bg-gray-200/50 animate-pulse rounded-full" />
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
            label={isConnected && !isAuthenticated ? 'Sign In' : undefined}
          />
        )}
      </div>
    </header>
  );
}
