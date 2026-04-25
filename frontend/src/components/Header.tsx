'use client';

import Link from 'next/link';
import { Box, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ConnectWalletButton from './auth/ConnectWalletButton';
import UserProfileDropdown from './auth/UserProfileDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const t = useTranslations('common.header');
  
  // TODO: Replace with actual wallet connection state
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('0x1234567890abcdef1234567890abcdef12345678');

  const handleConnect = () => {
    // TODO: Implement actual wallet connection
    router.push('/login');
  };

  const handleDisconnect = () => {
    // TODO: Implement actual wallet disconnection
    setIsConnected(false);
    router.push('/');
  };

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
        {isConnected ? (
          <UserProfileDropdown address={address} onDisconnect={handleDisconnect} />
        ) : (
          <ConnectWalletButton onClick={handleConnect} />
        )}
      </div>
    </header>
  );
}
