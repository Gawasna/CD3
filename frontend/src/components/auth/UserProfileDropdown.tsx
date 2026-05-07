'use client';

import { useState } from 'react';
import { User, Gavel, History, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';

import type { UserProfile } from '../../services/api/auth';

interface UserProfileDropdownProps {
  address: string;
  user?: UserProfile;
  onDisconnect: () => void;
}

export default function UserProfileDropdown({ address, user, onDisconnect }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const displayLabel = user?.displayName || shortAddress;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 h-10 px-3 bg-[#E7E8E5] rounded-full hover:bg-[#d8d9d6] transition-colors"
      >
        <div className="flex items-center justify-center w-8 h-8 bg-[#FF8400] rounded-full overflow-hidden">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-[#111111]" />
          )}
        </div>
        <span className="font-jetbrains text-sm font-medium text-[#111111] max-w-[120px] truncate">
          {displayLabel}
        </span>
        <ChevronDown className="w-4 h-4 text-[#666666]" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-[280px] p-2 bg-white rounded-2xl border border-[#CBCCC9] shadow-lg">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 w-full h-10 px-3 rounded-lg hover:bg-[#F2F3F0] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-5 h-5 text-[#111111]" />
              <span className="font-geist text-sm text-[#111111]">My Profile</span>
            </Link>

            <Link
              href="/dashboard/auctions"
              className="flex items-center gap-3 w-full h-10 px-3 rounded-lg hover:bg-[#F2F3F0] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Gavel className="w-5 h-5 text-[#111111]" />
              <span className="font-geist text-sm text-[#111111]">My Auctions</span>
            </Link>

            <Link
              href="/dashboard/bids"
              className="flex items-center gap-3 w-full h-10 px-3 rounded-lg hover:bg-[#F2F3F0] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <History className="w-5 h-5 text-[#111111]" />
              <span className="font-geist text-sm text-[#111111]">Bid History</span>
            </Link>

            <div className="w-full h-px bg-[#CBCCC9] my-1" />

            <button
              onClick={() => {
                onDisconnect();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full h-10 px-3 rounded-lg hover:bg-[#F2F3F0] transition-colors"
            >
              <LogOut className="w-5 h-5 text-[#FF8400]" />
              <span className="font-geist text-sm text-[#FF8400]">Disconnect</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
