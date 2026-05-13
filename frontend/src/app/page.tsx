'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import AuctionSection from '@/components/shared/AuctionSection';
import { useAuctions } from '@/hooks/useAuctions';
import { formatEther } from 'viem';

export default function Homepage() {
  const t = useTranslations('home');

  // Fetch real data from API
  const { data: endingSoonData } = useAuctions({ variant: 'ending-soon', limit: 3 });
  const { data: liveData } = useAuctions({ variant: 'live', limit: 3 });
  const { data: upcomingData } = useAuctions({ variant: 'upcoming', limit: 3 });

  // Transform API data to component format
  const endingSoonItems = endingSoonData?.data.map((auction) => ({
    id: auction.id,
    title: auction.title,
    seller: auction.seller.displayName || auction.seller.walletAddress.slice(0, 6) + '..' + auction.seller.walletAddress.slice(-4),
    price: formatEther(BigInt(auction.startingPriceWei)) + ' ETH',
  })) || [];

  const liveAuctionItems = liveData?.data.map((auction) => ({
    id: auction.id,
    title: auction.title,
    seller: auction.seller.displayName || auction.seller.walletAddress.slice(0, 6) + '..' + auction.seller.walletAddress.slice(-4),
    price: formatEther(BigInt(auction.startingPriceWei)) + ' ETH',
  })) || [];

  const upcomingItems = upcomingData?.data.map((auction) => ({
    id: auction.id,
    title: auction.title,
    seller: auction.seller.displayName || auction.seller.walletAddress.slice(0, 6) + '..' + auction.seller.walletAddress.slice(-4),
    price: 'Starting: ' + formatEther(BigInt(auction.startingPriceWei)) + ' ETH',
    timeInfo: 'Pending confirmation',
  })) || [];

  // Fallback to mock data if no real data
  const mockEndingSoon = [
    { id: 1, title: 'ThinkPad T480s - 99%', seller: '0x12..ABCD', price: '0.5 ETH' },
    { id: 2, title: 'Vintage Camera Canon AE-1', seller: '0x34..EF56', price: '0.8 ETH' },
    { id: 3, title: 'Gaming PC RTX 4090', seller: '0x56..GH78', price: '2.5 ETH' },
  ];

  const mockLive = [
    { id: 4, title: 'MacBook Pro M1 - Mint', seller: '0x34..EF56', price: '1.2 ETH' },
    { id: 5, title: 'Vintage Camera Canon AE-1', seller: '0x78..GH90', price: '0.8 ETH' },
    { id: 6, title: 'Gaming PC RTX 4090', seller: '0xAB..CD12', price: '2.5 ETH' },
  ];

  const mockUpcoming = [
    { id: 10, title: 'Tesla Model 3 2021', seller: '0xDE..FG78', price: 'Starting: 10 ETH', timeInfo: 'Starts in 2h' },
    { id: 11, title: 'Hermès Birkin Bag', seller: '0x12..AB90', price: 'Starting: 15 ETH', timeInfo: 'Starts in 5h' },
    { id: 12, title: 'Patek Philippe Watch', seller: '0x45..CD23', price: 'Starting: 25 ETH', timeInfo: 'Starts in 1d' },
  ];

  return (
    <div className="flex flex-col gap-12 p-8 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-6 p-20 bg-white rounded-2xl border border-[#CBCCC9] w-full">
        <h1 className="text-center font-jetbrains text-5xl font-extrabold text-[#111111]">
          {t('hero.title')}
        </h1>
        <p className="text-center font-geist text-lg text-[#666666]">
          {t('hero.description')}
        </p>
        <Link href="/explore" className="flex items-center justify-center h-10 px-6 py-2 gap-1.5 bg-[#FF8400] rounded-full text-[#111111] font-jetbrains text-base font-medium hover:opacity-90 transition-opacity">
          {t('hero.cta')}
        </Link>
      </section>

      {/* Ending Soon Section */}
      <AuctionSection
        title={t('sections.endingSoon.title')}
        viewAllText={t('sections.endingSoon.viewAll')}
        items={endingSoonItems.length > 0 ? endingSoonItems : mockEndingSoon}
        variant="ending-soon"
      />

      {/* Live Auctions Section */}
      <AuctionSection
        title={t('sections.liveAuctions.title')}
        viewAllText={t('sections.liveAuctions.viewAll')}
        items={liveAuctionItems.length > 0 ? liveAuctionItems : mockLive}
        variant="live"
      />

      {/* Upcoming Section */}
      <AuctionSection
        title={t('sections.upcoming.title')}
        viewAllText={t('sections.upcoming.viewAll')}
        items={upcomingItems.length > 0 ? upcomingItems : mockUpcoming}
        variant="upcoming"
      />
    </div>
  );
}
