'use client';

import Link from 'next/link';
import { Image, Heart, Clock3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type AuctionCardVariant = 'ending-soon' | 'live' | 'watching' | 'upcoming';

interface AuctionCardProps {
  id: string | number;
  title: string;
  seller: string;
  price: string;
  variant: AuctionCardVariant;
  timeInfo?: string; // For upcoming auctions
  imageUrl?: string;
}

export default function AuctionCard({
  id,
  title,
  seller,
  price,
  variant,
  timeInfo,
  imageUrl,
}: AuctionCardProps) {
  const t = useTranslations('home.card');
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

  const getTagContent = () => {
    switch (variant) {
      case 'ending-soon':
        return (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#E9E3D8] text-[#804200] font-jetbrains text-xs font-bold">
            ENDING
          </div>
        );
      case 'live':
        return (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#DFE6E1] text-[#004D1A] font-jetbrains text-xs font-bold">
            LIVE
          </div>
        );
      case 'watching':
        return (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#FF8400] flex items-center justify-center">
            <Heart className="w-4 h-4 text-[#111111] fill-[#111111]" />
          </div>
        );
      case 'upcoming':
        return (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5 text-[#111111]" />
            <span className="font-jetbrains text-xs font-semibold text-[#111111]">
              {timeInfo}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  const getButtonContent = () => {
    switch (variant) {
      case 'ending-soon':
      case 'live':
        return (
          <button className="h-10 px-4 py-2.5 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-medium hover:opacity-90 transition-opacity">
            {variant === 'live' ? t('bidNow') : t('placeBid')}
          </button>
        );
      case 'watching':
        return (
          <button className="h-10 px-4 py-2.5 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-medium hover:opacity-90 transition-opacity">
            {t('placeBid')}
          </button>
        );
      case 'upcoming':
        return (
          <button className="h-10 px-4 py-2.5 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] text-[#111111] font-jetbrains text-sm font-medium hover:bg-[#CBCCC9] transition-colors">
            {t('notifyMe')}
          </button>
        );
      default:
        return null;
    }
  };

  const getPriceLabel = () => {
    if (variant === 'upcoming') {
      return (
        <span className="font-jetbrains text-base font-semibold text-[#666666]">
          {price}
        </span>
      );
    }
    return (
      <span className="font-jetbrains text-xl font-bold text-[#111111]">
        {price}
      </span>
    );
  };

  return (
    <Link
      href={`/auctions/${id}`}
      className="flex flex-col w-full bg-white border border-[#CBCCC9] rounded-none overflow-hidden shadow-[0_1px_1.75px_0_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-transform"
    >
      {/* Image */}
      <div className="relative h-[200px] bg-[#E7E8E5] w-full flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}/uploads/auctions/${imageUrl}`} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <Image className="w-12 h-12 text-[#666666]" />
        )}
        {getTagContent()}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-6">
        <h3 className="font-jetbrains text-lg font-semibold text-[#111111]">
          {title}
        </h3>
        <p className="font-geist text-sm text-[#666666]">
          {t('seller')}: {seller}
        </p>
      </div>

      {/* Action */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-[#CBCCC9]">
        {getPriceLabel()}
        {getButtonContent()}
      </div>
    </Link>
  );
}
