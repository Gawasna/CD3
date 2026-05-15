'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Gavel, 
  Package, 
  Trophy, 
  Heart, 
  Image as ImageIcon, 
  Check,
  TrendingUp,
  LayoutDashboard,
  ShoppingBag,
  Clock,
  Eye,
  Edit,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listAuctions, getWatchlist, type Auction } from '@/services/api/auction';
import { useAuthStore } from '@/store/auth.store';
import { formatEther } from 'viem';
import { getThumbnail } from '@/features/auction/utils/media';

type TabType = 'my-bids' | 'my-auctions' | 'won-items' | 'watchlist' | 'orders';

type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  productName: string;
  productDescription: string;
  price: string;
  status: OrderStatus;
  image?: string;
}

// Mock activity data
const recentActivity = [
  { id: '1', type: 'won', text: 'You won the auction for Gaming PC RTX 4090', time: '2 hours ago' },
  { id: '2', type: 'outbid', text: 'Your bid on MacBook Pro M1 was outbid', time: '5 hours ago' },
  { id: '3', type: 'new_item', text: 'New item matching your interests', time: '1 day ago' },
];

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: '#12345',
    date: 'May 8, 2026',
    productName: 'Vintage Camera',
    productDescription: 'Classic film camera in excellent condition',
    price: '$450.00',
    status: 'delivered',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('my-bids');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');

  // Fetch real data
  const { data: myBidsData, isLoading: isLoadingBids } = useQuery({
    queryKey: ['my-bids', user?.id],
    queryFn: () => listAuctions({ bidderId: user?.id, limit: 10 }),
    enabled: !!user?.id,
  });

  const { data: myAuctionsData, isLoading: isLoadingAuctions } = useQuery({
    queryKey: ['my-auctions', user?.id],
    queryFn: () => listAuctions({ sellerId: user?.id, limit: 10 }),
    enabled: !!user?.id,
  });

  const { data: watchlistData, isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: () => getWatchlist({ limit: 10 }),
    enabled: !!user?.id,
  });

  // Calculate stats
  const stats = {
    activeBids: myBidsData?.meta.total || 0,
    itemsSelling: myAuctionsData?.meta.total || 0,
    wonAuctions: 0, // Placeholder for won items logic
    watching: watchlistData?.meta.total || 0,
  };

  const getBidStatusBadge = (auction: Auction) => {
    // Basic logic for winning/outbid in mock UI
    const isWinning = auction.winnerId === user?.id;
    const styles = isWinning 
      ? 'bg-[#DFE6E1] text-[#004D1A]' 
      : 'bg-[#E9E3D8] text-[#804200]';

    return (
      <span className={`px-3 py-1 rounded-full font-jetbrains text-xs font-bold ${styles}`}>
        {isWinning ? 'Winning' : 'Active'}
      </span>
    );
  };

  const getAuctionStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-[#DFE6E1] text-[#004D1A]',
      UPCOMING: 'bg-blue-100 text-blue-700',
      ENDED: 'bg-[#E9E3D8] text-[#804200]',
      PENDING: 'bg-[#E7E8E5] text-[#666666]',
    };

    return (
      <span className={`px-3 py-1 rounded-full font-jetbrains text-xs font-bold ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    const styles = {
      delivered: 'bg-[#DFE6E1] text-[#004D1A]',
      shipped: 'bg-[#E9E3D8] text-[#804200]',
      pending: 'bg-[#E7E8E5] text-[#111111]',
      cancelled: 'bg-[#E7E8E5] text-[#666666]',
    };

    return (
      <span className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getActivityIcon = (type: string) => {
    const iconProps = { className: 'w-5 h-5' };
    switch (type) {
      case 'won': return <Check {...iconProps} />;
      case 'outbid': return <TrendingUp {...iconProps} />;
      default: return <Heart {...iconProps} />;
    }
  };

  const renderTabContent = () => {
    const isLoading = 
      (activeTab === 'my-bids' && isLoadingBids) || 
      (activeTab === 'my-auctions' && isLoadingAuctions) || 
      (activeTab === 'watchlist' && isLoadingWatchlist);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-10 h-10 text-[#FF8400] animate-spin" />
        </div>
      );
    }

    switch (activeTab) {
      case 'my-bids':
        return (
          <div className="flex flex-col gap-4">
            <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">Active Bids</h2>
            <div className="flex flex-col gap-4">
              {myBidsData?.data.length === 0 ? (
                <EmptyState icon={<Gavel />} message="You haven't bid on any items yet." />
              ) : (
                myBidsData?.data.map((auction) => (
                  <AuctionListItem 
                    key={auction.id} 
                    auction={auction} 
                    badge={getBidStatusBadge(auction)}
                    extraInfo={`Price: ${formatEther(BigInt(auction.startingPriceWei))} ETH`}
                    actionLabel="View Auction"
                  />
                ))
              )}
            </div>
          </div>
        );

      case 'my-auctions':
        return (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">My Auctions</h2>
              <Link href="/create-auction" className="px-4 py-2.5 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-semibold hover:opacity-90 transition-opacity">
                Create New Auction
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              {myAuctionsData?.data.length === 0 ? (
                <EmptyState icon={<ShoppingBag />} message="You haven't created any auctions yet." />
              ) : (
                myAuctionsData?.data.map((auction) => (
                  <AuctionListItem 
                    key={auction.id} 
                    auction={auction} 
                    badge={getAuctionStatusBadge(auction.status)}
                    extraInfo={`${auction._count.bids} bids • Current: ${formatEther(BigInt(auction.startingPriceWei))} ETH`}
                    isSeller
                  />
                ))
              )}
            </div>
          </div>
        );

      case 'watchlist':
        return (
          <div className="flex flex-col gap-4">
            <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">My Watchlist</h2>
            <div className="flex flex-col gap-4">
              {watchlistData?.data.length === 0 ? (
                <EmptyState icon={<Heart />} message="Your watchlist is empty." />
              ) : (
                watchlistData?.data.map((auction) => (
                  <AuctionListItem 
                    key={auction.id} 
                    auction={auction} 
                    badge={getAuctionStatusBadge(auction.status)}
                    extraInfo={`Starting at: ${formatEther(BigInt(auction.startingPriceWei))} ETH`}
                    actionLabel="View Details"
                  />
                ))
              )}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex gap-2">
              {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map((f) => (
                <button
                  key={f}
                  onClick={() => setOrderStatusFilter(f as any)}
                  className={`px-6 py-3 rounded-2xl font-jetbrains text-sm font-semibold transition-colors ${
                    orderStatusFilter === f ? 'bg-[#FF8400] text-[#111111]' : 'text-[#666666] hover:bg-[#E7E8E5]'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <EmptyState icon={<Package />} message="Order history is coming soon." />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] bg-[#F2F3F0] gap-4">
        <AlertCircle className="w-16 h-16 text-[#FF8400]" />
        <h2 className="font-jetbrains text-2xl font-bold">Please log in to view your dashboard</h2>
        <Link href="/login" className="px-6 py-2 bg-[#FF8400] rounded-full font-jetbrains font-medium">Log In</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-[#CBCCC9] p-8 flex flex-col gap-2 flex-shrink-0">
        <SidebarButton 
          active={activeTab === 'my-bids'} 
          onClick={() => setActiveTab('my-bids')} 
          icon={<LayoutDashboard className="w-5 h-5" />} 
          label="My Bids" 
        />
        <SidebarButton 
          active={activeTab === 'my-auctions'} 
          onClick={() => setActiveTab('my-auctions')} 
          icon={<ShoppingBag className="w-5 h-5" />} 
          label="My Auctions" 
        />
        <SidebarButton 
          active={activeTab === 'watchlist'} 
          onClick={() => setActiveTab('watchlist')} 
          icon={<Heart className="w-5 h-5" />} 
          label="Watchlist" 
        />
        <SidebarButton 
          active={activeTab === 'orders'} 
          onClick={() => setActiveTab('orders')} 
          icon={<Package className="w-5 h-5" />} 
          label="Orders" 
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 flex flex-col gap-8 overflow-auto">
        <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard icon={<Gavel />} value={stats.activeBids} label="Active Bids" />
          <StatCard icon={<Package />} value={stats.itemsSelling} label="Items Selling" />
          <StatCard icon={<Trophy />} value={stats.wonAuctions} label="Won Auctions" />
          <StatCard icon={<Heart />} value={stats.watching} label="Watching" />
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Recent Activity */}
        <div className="flex flex-col gap-4">
          <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">Recent Activity</h2>
          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 py-3 border-b last:border-0 border-[#F2F3F0]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#F2F3F0]`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-geist text-sm text-[#111111]">{activity.text}</span>
                  <span className="font-geist text-xs text-[#666666]">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-jetbrains text-sm font-semibold transition-colors ${
        active ? 'bg-[#FF8400] text-[#111111]' : 'text-[#666666] hover:bg-[#E7E8E5]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-3">
      <div className="text-[#FF8400]">{icon}</div>
      <span className="font-jetbrains text-4xl font-extrabold text-[#111111]">{value}</span>
      <span className="font-geist text-sm text-[#666666]">{label}</span>
    </div>
  );
}

function AuctionListItem({ 
  auction, 
  badge, 
  extraInfo, 
  actionLabel = "View", 
  isSeller = false 
}: { 
  auction: Auction, 
  badge: React.ReactNode, 
  extraInfo: string, 
  actionLabel?: string,
  isSeller?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#CBCCC9] p-5 flex items-center gap-4">
      <div className="w-20 h-20 bg-[#E7E8E5] rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        {auction.ipfsCid ? (
          <img src={getThumbnail(auction.ipfsCid)} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-[#666666]" />
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <h3 className="font-jetbrains text-lg font-semibold text-[#111111]">{auction.title}</h3>
        <div className="flex items-center gap-4">
          {badge}
          <span className="font-jetbrains text-sm font-semibold text-[#111111]">{extraInfo}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/auctions/${auction.id}`}
          className="px-6 py-2.5 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] text-[#111111] font-jetbrains text-sm font-semibold hover:bg-[#CBCCC9] transition-colors"
        >
          {actionLabel}
        </Link>
        {isSeller && auction.status === 'PENDING' && (
          <button className="px-6 py-2.5 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-semibold hover:opacity-90 transition-opacity">
            Retry Sync
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode, message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#CBCCC9] p-12 flex flex-col items-center justify-center gap-4">
      <div className="text-[#CBCCC9] scale-150">{icon}</div>
      <p className="font-geist text-lg text-[#666666]">{message}</p>
    </div>
  );
}
