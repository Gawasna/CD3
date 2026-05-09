'use client';

import { Clock3, TrendingUp, Laptop, Watch, Shirt } from 'lucide-react';
import Link from 'next/link';

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchDropdown({ isOpen, onClose }: SearchDropdownProps) {
  if (!isOpen) return null;

  const recentSearches = [
    'MacBook Pro M1',
    'Vintage Camera',
    'Gaming PC',
  ];

  const trending = [
    'Rolex Watches',
    'Vintage Electronics',
    'Luxury Bags',
  ];

  const categories = [
    { icon: Laptop, name: 'Electronics', href: '/auctions?category=electronics' },
    { icon: Watch, name: 'Watches & Jewelry', href: '/auctions?category=watches' },
    { icon: Shirt, name: 'Fashion & Accessories', href: '/auctions?category=fashion' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className="absolute top-full left-0 right-0 mt-2 w-[400px] bg-white rounded-2xl border border-[#CBCCC9] shadow-[0_4px_12px_0_rgba(0,0,0,0.08)] z-50 overflow-hidden">
        {/* Recent Searches */}
        <div className="py-2">
          <div className="px-4 py-2">
            <span className="font-jetbrains text-[11px] font-bold text-[#666666] uppercase tracking-wide">
              Recent Searches
            </span>
          </div>
          {recentSearches.map((search, index) => (
            <Link
              key={index}
              href={`/auctions?q=${encodeURIComponent(search)}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F2F3F0] transition-colors"
              onClick={onClose}
            >
              <Clock3 className="w-4 h-4 text-[#666666]" />
              <span className="font-geist text-sm text-[#111111]">{search}</span>
            </Link>
          ))}
        </div>

        <div className="w-full h-px bg-[#CBCCC9]" />

        {/* Trending */}
        <div className="py-2">
          <div className="px-4 py-2">
            <span className="font-jetbrains text-[11px] font-bold text-[#666666] uppercase tracking-wide">
              Trending
            </span>
          </div>
          {trending.map((item, index) => (
            <Link
              key={index}
              href={`/auctions?q=${encodeURIComponent(item)}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F2F3F0] transition-colors"
              onClick={onClose}
            >
              <TrendingUp className="w-4 h-4 text-[#FF8400]" />
              <span className="font-geist text-sm text-[#111111]">{item}</span>
            </Link>
          ))}
        </div>

        <div className="w-full h-px bg-[#CBCCC9]" />

        {/* Categories */}
        <div className="py-2">
          <div className="px-4 py-2">
            <span className="font-jetbrains text-[11px] font-bold text-[#666666] uppercase tracking-wide">
              Categories
            </span>
          </div>
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link
                key={index}
                href={category.href}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#F2F3F0] transition-colors"
                onClick={onClose}
              >
                <Icon className="w-4 h-4 text-[#666666]" />
                <span className="font-geist text-sm text-[#111111]">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
