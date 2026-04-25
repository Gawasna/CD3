'use client';

import { CheckCircle, Coins, Activity } from 'lucide-react';

export default function DashboardPage() {
  // TODO: Get real data from wallet/backend
  const mockData = {
    network: 'Sepolia Testnet',
    balance: '2.45 ETH',
    activeBids: 3,
  };

  return (
    <div className="flex flex-col gap-6 p-8 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Welcome Card */}
      <div className="flex flex-col gap-4 w-full p-6 bg-white border border-[#CBCCC9] rounded-2xl">
        <h1 className="font-jetbrains text-2xl font-bold text-[#111111]">
          Welcome Back!
        </h1>
        <p className="font-geist text-sm text-[#666666] leading-relaxed">
          You are successfully authenticated with your wallet. You can now participate in auctions, 
          create listings, and manage your bids.
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-4 w-full mt-2">
          <div className="flex flex-col gap-2 flex-1 p-4 bg-[#DFE6E1] rounded-2xl">
            <CheckCircle className="w-6 h-6 text-[#004D1A]" />
            <span className="font-geist text-xs text-[#004D1A]">Connected</span>
            <span className="font-jetbrains text-base font-semibold text-[#004D1A]">
              {mockData.network}
            </span>
          </div>

          <div className="flex flex-col gap-2 flex-1 p-4 bg-[#E7E8E5] rounded-2xl">
            <Coins className="w-6 h-6 text-[#111111]" />
            <span className="font-geist text-xs text-[#666666]">Balance</span>
            <span className="font-jetbrains text-base font-semibold text-[#111111]">
              {mockData.balance}
            </span>
          </div>

          <div className="flex flex-col gap-2 flex-1 p-4 bg-[#E7E8E5] rounded-2xl">
            <Activity className="w-6 h-6 text-[#111111]" />
            <span className="font-geist text-xs text-[#666666]">Active Bids</span>
            <span className="font-jetbrains text-base font-semibold text-[#111111]">
              {mockData.activeBids}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex flex-col gap-4 w-full p-6 bg-white border border-[#CBCCC9] rounded-2xl">
        <h2 className="font-jetbrains text-xl font-bold text-[#111111]">
          Recent Activity
        </h2>
        <p className="font-geist text-sm text-[#666666]">
          Your recent auction activity will appear here.
        </p>
      </div>
    </div>
  );
}
