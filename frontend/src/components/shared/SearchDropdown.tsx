'use client';

import { TrendingUp, Laptop, Watch, Shirt, Loader2, Cpu, ShoppingBag, Sofa, Star } from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';
import { useAuctions } from '@/hooks/useAuctions';
import { AuctionImage } from '@/features/auction/components/AuctionImage';
import { getFirstImageFilename } from '@/features/auction/utils/media';
import type { Auction, AuctionCategory } from '@/services/api/auction';

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  // searchQuery drives live API lookup when non-empty (>= 2 chars)
  searchQuery?: string;
}

const TRENDING_ITEMS = [
  'Rolex Watches',
  'Vintage Electronics',
  'Luxury Bags',
];

const CATEGORY_LINKS = [
  { icon: Laptop, name: 'Electronics', href: '/explore?categories=electronics' },
  { icon: Watch, name: 'Watches & Jewelry', href: '/explore?categories=watches' },
  { icon: Shirt, name: 'Fashion & Accessories', href: '/explore?categories=fashion' },
];

// Map category → { bg gradient, icon, text color }
const CATEGORY_STYLE: Record<AuctionCategory, { gradient: string; Icon: React.ElementType; color: string }> = {
  ELECTRONICS:  { gradient: 'from-blue-400 to-indigo-500',   Icon: Cpu,        color: '#fff' },
  FASHION:      { gradient: 'from-pink-400 to-rose-500',     Icon: ShoppingBag, color: '#fff' },
  FURNITURE:    { gradient: 'from-amber-400 to-orange-500',  Icon: Sofa,       color: '#fff' },
  COLLECTIBLES: { gradient: 'from-emerald-400 to-teal-500',  Icon: Star,       color: '#fff' },
  OTHER:        { gradient: 'from-gray-400 to-slate-500',    Icon: Laptop,     color: '#fff' },
};

// Fallback avatar: category-colored gradient + initials of title
function AuctionThumbnailFallback({ category, title }: { category: AuctionCategory; title: string }) {
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.OTHER;
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${style.gradient}`}>
      <span className="font-jetbrains text-[10px] font-extrabold text-white leading-none select-none">
        {initials}
      </span>
    </div>
  );
}

// Quick result row for a single auction from real API data
function QuickResult({ auction, onClose }: { auction: Auction; onClose: () => void }) {
  const priceEth = formatEther(BigInt(auction.startingPriceWei));
  const priceLabel = `${parseFloat(priceEth).toFixed(4)} ETH`;
  const filename = getFirstImageFilename(auction.ipfsCid);

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F2F3F0] transition-colors"
      onClick={onClose}
    >
      <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 relative">
        {filename ? (
          <AuctionImage
            filename={filename}
            alt={auction.title}
            fill
            sizes="32px"
            className="object-cover"
          />
        ) : (
          <AuctionThumbnailFallback category={auction.category} title={auction.title} />
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-geist text-sm text-[#111111] truncate">{auction.title}</span>
        <span className="font-geist text-xs text-[#666666]">Starting: {priceLabel}</span>
      </div>
      <span className="font-jetbrains text-[10px] font-bold uppercase text-[#FF8400] flex-shrink-0">
        {auction.status === 'ACTIVE' ? 'Live' : auction.status === 'PENDING' ? 'Upcoming' : auction.status}
      </span>
    </Link>
  );
}

export default function SearchDropdown({ isOpen, onClose, searchQuery = '' }: SearchDropdownProps) {
  const hasQuery = searchQuery.trim().length >= 2;

  const { data: quickData, isLoading } = useAuctions({
    search: hasQuery ? searchQuery.trim() : undefined,
    limit: 5,
  });

  if (!isOpen) return null;

  const quickResults: Auction[] = hasQuery ? (quickData?.data ?? []) : [];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div className="absolute top-full left-0 right-0 mt-2 w-[400px] bg-white rounded-2xl border border-[#CBCCC9] shadow-[0_4px_12px_0_rgba(0,0,0,0.08)] z-50 overflow-hidden">

        {/* --- Live Search Results (when query >= 2 chars) --- */}
        {hasQuery && (
          <>
            <div className="py-2">
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="font-jetbrains text-[11px] font-bold text-[#666666] uppercase tracking-wide">
                  Quick Results
                </span>
                {isLoading && <Loader2 className="w-3 h-3 text-[#FF8400] animate-spin" />}
              </div>

              {isLoading ? (
                // Skeleton rows while fetching
                <div className="flex flex-col">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                      <div className="w-8 h-8 rounded-md bg-[#F2F3F0] flex-shrink-0" />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="h-3 bg-[#F2F3F0] rounded w-3/4" />
                        <div className="h-2 bg-[#F2F3F0] rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : quickResults.length > 0 ? (
                <>
                  {quickResults.map((auction) => (
                    <QuickResult key={auction.id} auction={auction} onClose={onClose} />
                  ))}
                  <Link
                    href={`/explore?search=${encodeURIComponent(searchQuery.trim())}`}
                    className="flex items-center justify-center py-3 text-xs font-semibold text-[#FF8400] hover:underline font-geist border-t border-[#F2F3F0] mt-1"
                    onClick={onClose}
                  >
                    See all results for &quot;{searchQuery.trim()}&quot;
                  </Link>
                </>
              ) : (
                <div className="px-4 py-3 text-sm text-[#666666] font-geist">
                  No results found for &quot;{searchQuery.trim()}&quot;
                </div>
              )}
            </div>
            <div className="w-full h-px bg-[#CBCCC9]" />
          </>
        )}

        {/* --- Default State: Trending (only shown when no active query) --- */}
        {!hasQuery && (
          <>
            <div className="py-2">
              <div className="px-4 py-2">
                <span className="font-jetbrains text-[11px] font-bold text-[#666666] uppercase tracking-wide">
                  Trending
                </span>
              </div>
              {TRENDING_ITEMS.map((item, index) => (
                <Link
                  key={index}
                  href={`/explore?search=${encodeURIComponent(item)}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#F2F3F0] transition-colors"
                  onClick={onClose}
                >
                  <TrendingUp className="w-4 h-4 text-[#FF8400]" />
                  <span className="font-geist text-sm text-[#111111]">{item}</span>
                </Link>
              ))}
            </div>
            <div className="w-full h-px bg-[#CBCCC9]" />
          </>
        )}

        {/* --- Categories (always shown) --- */}
        <div className="py-2">
          <div className="px-4 py-2">
            <span className="font-jetbrains text-[11px] font-bold text-[#666666] uppercase tracking-wide">
              Categories
            </span>
          </div>
          {CATEGORY_LINKS.map((category, index) => {
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
