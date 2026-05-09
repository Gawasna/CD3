'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Gavel, 
  Package, 
  Trophy, 
  Heart, 
  Image, 
  Check,
  TrendingUp,
  LayoutDashboard,
  ShoppingBag,
  Clock,
  Eye,
  Edit,
  XCircle
} from 'lucide-react';

interface BidItem {
  id: string;
  title: string;
  yourBid: string;
  status: 'winning' | 'outbid' | 'ended';
  image?: string;
}

interface AuctionItem {
  id: string;
  title: string;
  currentBid: string;
  bids: number;
  status: 'active' | 'ended' | 'draft';
  image?: string;
}

interface WonItem {
  id: string;
  title: string;
  finalPrice: string;
  status: 'pending' | 'shipped' | 'delivered';
  image?: string;
}

interface Activity {
  id: string;
  type: 'won' | 'outbid' | 'new_item' | 'sold';
  text: string;
  time: string;
}

type TabType = 'my-bids' | 'my-auctions' | 'won-items';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('my-bids');

  // Mock data
  const stats = {
    activeBids: 12,
    itemsSelling: 5,
    wonAuctions: 8,
    watching: 24,
  };

  const activeBids: BidItem[] = [
    { id: '1', title: 'ThinkPad T480s - 99%', yourBid: '0.5 ETH', status: 'winning' },
    { id: '2', title: 'Vintage Camera Canon AE-1', yourBid: '0.8 ETH', status: 'outbid' },
  ];

  const myAuctions: AuctionItem[] = [
    { id: '1', title: 'MacBook Pro M1 - Mint', currentBid: '1.2 ETH', bids: 12, status: 'active' },
    { id: '2', title: 'Gaming PC RTX 4090', currentBid: '2.5 ETH', bids: 8, status: 'active' },
    { id: '3', title: 'Vintage Watch', currentBid: '0 ETH', bids: 0, status: 'draft' },
  ];

  const wonItems: WonItem[] = [
    { id: '1', title: 'Sony A7 III Camera', finalPrice: '1.5 ETH', status: 'delivered' },
    { id: '2', title: 'iPhone 14 Pro Max', finalPrice: '0.9 ETH', status: 'shipped' },
  ];

  const recentActivity: Activity[] = [
    { id: '1', type: 'won', text: 'You won the auction for Gaming PC RTX 4090', time: '2 hours ago' },
    { id: '2', type: 'outbid', text: 'Your bid on MacBook Pro M1 was outbid', time: '5 hours ago' },
    { id: '3', type: 'new_item', text: 'New item matching your interests', time: '1 day ago' },
  ];

  const getBidStatusBadge = (status: BidItem['status']) => {
    const styles = {
      winning: 'bg-[#DFE6E1] text-[#004D1A]',
      outbid: 'bg-[#E9E3D8] text-[#804200]',
      ended: 'bg-[#E7E8E5] text-[#111111]',
    };

    const labels = {
      winning: 'Winning',
      outbid: 'Outbid',
      ended: 'Ended',
    };

    return (
      <span className={`px-3 py-1 rounded-full font-jetbrains text-xs font-bold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getAuctionStatusBadge = (status: AuctionItem['status']) => {
    const styles = {
      active: 'bg-[#DFE6E1] text-[#004D1A]',
      ended: 'bg-[#E9E3D8] text-[#804200]',
      draft: 'bg-[#E7E8E5] text-[#111111]',
    };

    const labels = {
      active: 'LIVE',
      ended: 'ENDED',
      draft: 'DRAFT',
    };

    return (
      <span className={`px-3 py-1 rounded-full font-jetbrains text-xs font-bold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getWonStatusBadge = (status: WonItem['status']) => {
    const styles = {
      pending: 'bg-[#E9E3D8] text-[#804200]',
      shipped: 'bg-[#DFE6E1] text-[#004D1A]',
      delivered: 'bg-[#DFE6E1] text-[#004D1A]',
    };

    const labels = {
      pending: 'Pending',
      shipped: 'Shipped',
      delivered: 'Delivered',
    };

    return (
      <span className={`px-3 py-1 rounded-full font-jetbrains text-xs font-bold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getActivityIcon = (type: Activity['type']) => {
    const iconProps = { className: 'w-5 h-5' };
    
    switch (type) {
      case 'won':
        return <Check {...iconProps} />;
      case 'outbid':
        return <TrendingUp {...iconProps} />;
      case 'new_item':
        return <Heart {...iconProps} />;
      case 'sold':
        return <Package {...iconProps} />;
      default:
        return <Check {...iconProps} />;
    }
  };

  const getActivityIconBg = (type: Activity['type']) => {
    switch (type) {
      case 'won':
        return 'bg-[#DFE6E1] text-[#004D1A]';
      case 'outbid':
        return 'bg-[#FF8400] text-[#111111]';
      case 'new_item':
        return 'bg-[#E7E8E5] text-[#111111]';
      case 'sold':
        return 'bg-[#DFE6E1] text-[#004D1A]';
      default:
        return 'bg-[#E7E8E5] text-[#111111]';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'my-bids':
        return (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">
                Active Bids
              </h2>
              <Link
                href="/my-products"
                className="font-jetbrains text-sm font-semibold text-[#FF8400] hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              {activeBids.map((bid) => (
                <div
                  key={bid.id}
                  className="bg-white rounded-2xl border border-[#CBCCC9] p-5 flex items-center gap-4"
                >
                  <div className="w-20 h-20 bg-[#E7E8E5] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Image className="w-8 h-8 text-[#666666]" />
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="font-jetbrains text-lg font-semibold text-[#111111]">
                      {bid.title}
                    </h3>
                    <div className="flex items-center gap-4">
                      {getBidStatusBadge(bid.status)}
                      <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                        Your bid: {bid.yourBid}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/auctions/${bid.id}`}
                      className="px-4 py-2.5 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] text-[#111111] font-jetbrains text-sm font-semibold hover:bg-[#CBCCC9] transition-colors"
                    >
                      View
                    </Link>
                    <button className="px-4 py-2.5 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-semibold hover:opacity-90 transition-opacity">
                      Increase Bid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'my-auctions':
        return (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">
                My Auctions
              </h2>
              <Link
                href="/create-auction"
                className="px-4 py-2.5 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Create New Auction
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              {myAuctions.map((auction) => (
                <div
                  key={auction.id}
                  className="bg-white rounded-2xl border border-[#CBCCC9] p-5 flex items-center gap-4"
                >
                  <div className="w-20 h-20 bg-[#E7E8E5] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Image className="w-8 h-8 text-[#666666]" />
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="font-jetbrains text-lg font-semibold text-[#111111]">
                      {auction.title}
                    </h3>
                    <div className="flex items-center gap-4">
                      {getAuctionStatusBadge(auction.status)}
                      <span className="font-geist text-sm text-[#666666]">
                        {auction.bids} bids
                      </span>
                      <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                        Current: {auction.currentBid}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/auctions/${auction.id}`}
                      className="px-4 py-2.5 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] text-[#111111] font-jetbrains text-sm font-semibold hover:bg-[#CBCCC9] transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <Link
                      href={`/auctions/${auction.id}/edit`}
                      className="px-4 py-2.5 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button className="px-4 py-2.5 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] text-[#111111] font-jetbrains text-sm font-semibold hover:bg-[#CBCCC9] transition-colors flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      End
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'won-items':
        return (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">
                Won Items
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {wonItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#CBCCC9] p-5 flex items-center gap-4"
                >
                  <div className="w-20 h-20 bg-[#E7E8E5] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Image className="w-8 h-8 text-[#666666]" />
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="font-jetbrains text-lg font-semibold text-[#111111]">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-4">
                      {getWonStatusBadge(item.status)}
                      <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                        Final Price: {item.finalPrice}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/orders/${item.id}`}
                      className="px-4 py-2.5 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-[#CBCCC9] p-8 flex flex-col gap-2">
        <button
          onClick={() => setActiveTab('my-bids')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-jetbrains text-sm font-semibold transition-colors ${
            activeTab === 'my-bids'
              ? 'bg-[#FF8400] text-[#111111]'
              : 'text-[#666666] hover:bg-[#E7E8E5]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          My Bids
        </button>
        <button
          onClick={() => setActiveTab('my-auctions')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-jetbrains text-sm font-semibold transition-colors ${
            activeTab === 'my-auctions'
              ? 'bg-[#FF8400] text-[#111111]'
              : 'text-[#666666] hover:bg-[#E7E8E5]'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          My Auctions
        </button>
        <button
          onClick={() => setActiveTab('won-items')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-jetbrains text-sm font-semibold transition-colors ${
            activeTab === 'won-items'
              ? 'bg-[#FF8400] text-[#111111]'
              : 'text-[#666666] hover:bg-[#E7E8E5]'
          }`}
        >
          <Clock className="w-5 h-5" />
          Won Items
        </button>
        <Link
          href="/orders"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl font-jetbrains text-sm font-semibold text-[#666666] hover:bg-[#E7E8E5] transition-colors"
        >
          <Package className="w-5 h-5" />
          Orders
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 flex flex-col gap-8">
        <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">
          Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-3">
            <Gavel className="w-8 h-8 text-[#FF8400]" />
            <span className="font-jetbrains text-4xl font-extrabold text-[#111111]">
              {stats.activeBids}
            </span>
            <span className="font-geist text-sm text-[#666666]">Active Bids</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-3">
            <Package className="w-8 h-8 text-[#FF8400]" />
            <span className="font-jetbrains text-4xl font-extrabold text-[#111111]">
              {stats.itemsSelling}
            </span>
            <span className="font-geist text-sm text-[#666666]">Items Selling</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-3">
            <Trophy className="w-8 h-8 text-[#FF8400]" />
            <span className="font-jetbrains text-4xl font-extrabold text-[#111111]">
              {stats.wonAuctions}
            </span>
            <span className="font-geist text-sm text-[#666666]">Won Auctions</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-3">
            <Heart className="w-8 h-8 text-[#FF8400]" />
            <span className="font-jetbrains text-4xl font-extrabold text-[#111111]">
              {stats.watching}
            </span>
            <span className="font-geist text-sm text-[#666666]">Watching</span>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Recent Activity */}
        <div className="flex flex-col gap-4">
          <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">
            Recent Activity
          </h2>

          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 py-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityIconBg(
                    activity.type
                  )}`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-geist text-sm text-[#111111]">
                    {activity.text}
                  </span>
                  <span className="font-geist text-xs text-[#666666]">
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
