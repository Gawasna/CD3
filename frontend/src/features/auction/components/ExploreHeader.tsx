"use client";

import { Search, Box } from "lucide-react";
import { useTranslations } from "next-intl";

interface ExploreHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function ExploreHeader({ searchValue, onSearchChange }: ExploreHeaderProps) {
  const t = useTranslations("explore");

  return (
    <header className="flex items-center justify-between h-[72px] px-8 bg-[#F2F3F0] border-b border-[#CBCCC9]">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Box className="w-8 h-8 text-[#FF8400]" />
        <span className="text-[22px] font-extrabold tracking-wider text-[#111111] font-mono">
          P2P AUCTION
        </span>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 px-4 h-10 w-[400px] border border-[#CBCCC9] rounded-full bg-white/50 focus-within:bg-white focus-within:border-[#FF8400] transition-all">
        <Search className="w-5 h-5 text-[#666666]" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for items, collections..."
          className="flex-1 bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#666666]"
        />
      </div>

      {/* Connect Wallet Button */}
      <div className="flex items-center gap-4">
        <button
          className="h-10 px-4 rounded-full bg-[#FF8400] text-[#111111] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Connect Wallet
        </button>
      </div>
    </header>
  );
}
