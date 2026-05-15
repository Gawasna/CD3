'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuctions } from '@/hooks/useAuctions';
import { formatEther } from 'viem';
import { getThumbnail } from '@/features/auction/utils/media';
import { Loader2, Search, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';

export default function ExploreAuctions() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [variantFilter, setVariantFilter] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = useAuctions({
    status: statusFilter,
    variant: variantFilter as any,
    page,
    limit: 12,
  });

  const handleStatusChange = (status: string | undefined) => {
    setStatusFilter(status);
    setVariantFilter(undefined);
    setPage(1);
  };

  const handleVariantChange = (variant: string | undefined) => {
    setVariantFilter(variant);
    setStatusFilter(undefined);
    setPage(1);
  };

  return (
    <div className="flex gap-12 p-12 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Filter Sidebar */}
      <aside className="flex flex-col gap-8 w-[280px] shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-[#111111]" />
          <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">Filters</h2>
        </div>
        
        <div className="flex flex-col gap-4">
          <h3 className="font-jetbrains font-semibold text-lg text-[#111111]">Status</h3>
          <div className="flex flex-col gap-3 font-geist text-[#666666]">
            <label className="flex items-center gap-2 cursor-pointer hover:text-[#FF8400] transition-colors">
              <input 
                type="radio" 
                name="status" 
                checked={!statusFilter && !variantFilter}
                onChange={() => { setStatusFilter(undefined); setVariantFilter(undefined); }}
                className="text-[#FF8400] focus:ring-[#FF8400]" 
              /> All Auctions
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-[#FF8400] transition-colors">
              <input 
                type="radio" 
                name="status" 
                checked={statusFilter === 'ACTIVE' && !variantFilter}
                onChange={() => handleStatusChange('ACTIVE')}
                className="text-[#FF8400] focus:ring-[#FF8400]" 
              /> Active
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-[#FF8400] transition-colors">
              <input 
                type="radio" 
                name="status" 
                checked={variantFilter === 'upcoming'}
                onChange={() => handleVariantChange('upcoming')}
                className="text-[#FF8400] focus:ring-[#FF8400]" 
              /> Upcoming
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-[#FF8400] transition-colors">
              <input 
                type="radio" 
                name="status" 
                checked={variantFilter === 'ending-soon'}
                onChange={() => handleVariantChange('ending-soon')}
                className="text-[#FF8400] focus:ring-[#FF8400]" 
              /> Ending Soon
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-[#FF8400] transition-colors">
              <input 
                type="radio" 
                name="status" 
                checked={statusFilter === 'ENDED'}
                onChange={() => handleStatusChange('ENDED')}
                className="text-[#FF8400] focus:ring-[#FF8400]" 
              /> Completed
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-jetbrains font-semibold text-lg text-[#111111]">Categories</h3>
          <div className="flex flex-col gap-2 font-geist text-[#666666]">
            {['ELECTRONICS', 'FASHION', 'FURNITURE', 'COLLECTIBLES', 'OTHER'].map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer opacity-50 cursor-not-allowed">
                <input type="checkbox" className="rounded" disabled /> {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </label>
            ))}
            <p className="text-[10px] italic">Category filtering coming soon</p>
          </div>
        </div>
      </aside>

      {/* Grid Content */}
      <main className="flex flex-col gap-8 flex-1">
        <div className="flex justify-between items-center w-full">
          <h2 className="font-geist text-lg text-[#666666]">
            {isLoading ? 'Loading auctions...' : `Showing ${data?.meta.total || 0} items`}
          </h2>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input 
                type="text" 
                placeholder="Search auctions..." 
                className="pl-9 pr-4 py-1.5 border border-[#CBCCC9] rounded-full font-geist text-sm focus:outline-none focus:border-[#FF8400] w-64"
              />
            </div>
            <select className="border border-[#CBCCC9] rounded-full px-4 py-1.5 font-geist text-sm text-[#111111] bg-white focus:outline-none appearance-none cursor-pointer">
              <option>Recently Listed</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#FF8400] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-red-500 font-jetbrains">Failed to load auctions</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#FF8400] rounded-full font-jetbrains text-sm">Retry</button>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-[#CBCCC9]">
            <ImageIcon className="w-16 h-16 text-[#CBCCC9]" />
            <p className="font-geist text-lg text-[#666666]">No auctions found matching your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.data.map((auction) => (
                <Link 
                  href={`/auctions/${auction.id}`} 
                  key={auction.id} 
                  className="flex flex-col w-full bg-white border border-[#CBCCC9] rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="h-48 bg-[#E7E8E5] w-full relative overflow-hidden">
                    {auction.ipfsCid ? (
                      <img 
                        src={getThumbnail(auction.ipfsCid)} 
                        alt={auction.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-[#666666]" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white font-jetbrains text-[10px] font-bold">
                      {auction.status}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    <h3 className="font-jetbrains font-bold text-lg text-[#111111] line-clamp-1 group-hover:text-[#FF8400] transition-colors">
                      {auction.title}
                    </h3>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-geist text-xs text-[#666666]">Current Bid</span>
                        <span className="font-jetbrains font-bold text-[#FF8400]">
                          {formatEther(BigInt(auction.startingPriceWei))} ETH
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-geist text-xs text-[#666666]">Bids</span>
                        <span className="font-jetbrains font-semibold text-[#111111]">
                          {auction._count.bids}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data && data.meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-full font-jetbrains text-sm font-bold transition-all ${
                      page === p 
                        ? 'bg-[#FF8400] text-[#111111]' 
                        : 'bg-white border border-[#CBCCC9] text-[#666666] hover:border-[#FF8400]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
