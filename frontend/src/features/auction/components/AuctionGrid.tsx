"use client";

import { useState } from "react";
import { ChevronDown, Grid3x3, List, Loader2, Box, X, Search as SearchIcon } from "lucide-react";
import { AuctionCard } from "./AuctionCard";
import { useTranslations } from "next-intl";
import { useAuctions } from "@/hooks/useAuctions";
import { formatEther } from "viem";
import { getFirstImageFilename } from "../utils/media";

interface AuctionGridProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  selectedCategories: string[];
  selectedStatus: string;
  search?: string;
}

export function AuctionGrid({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedCategories,
  selectedStatus,
  search,
}: AuctionGridProps) {
  const t = useTranslations("explore");
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const { data: auctionsData, isLoading, isFetching } = useAuctions({
    status: selectedStatus === "all" ? undefined : (selectedStatus === "ending_soon" ? "ACTIVE" : selectedStatus.toUpperCase()),
    variant: selectedStatus === "ending_soon" ? "ending-soon" : undefined,
    categories: selectedCategories,
    search: search,
    sortBy: sortBy,
    limit: 50,
  });

  const auctions = auctionsData?.data.map((auction: any) => {
    const image = getFirstImageFilename(auction.ipfsCid) || '';
    const end = new Date(auction.endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    
    let timeLeft = "Ended";
    let status: "live" | "ending" | "upcoming" | "ended" = "ended";

    if (auction.status === "PENDING") {
      status = "upcoming";
      timeLeft = "Upcoming";
    } else if (auction.status === "ACTIVE") {
      if (diff > 0) {
        status = diff < 24 * 60 * 60 * 1000 ? "ending" : "live";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timeLeft = `${hours}h ${mins}m left`;
      } else {
        status = "ended";
        timeLeft = "Ended";
      }
    } else {
      status = "ended";
      timeLeft = "Ended";
    }

    return {
      id: auction.id,
      title: auction.title,
      image,
      currentBid: formatEther(BigInt(auction.startingPriceWei)),
      bids: auction._count?.bids || 0,
      timeLeft,
      status,
      category: auction.category.toLowerCase(),
    };
  }) || [];

  const sortOptions = [
    { id: "newest", label: "Newest" },
    { id: "ending_soon", label: "Ending Soon" },
    { id: "price_low", label: "Price: Low to High" },
    { id: "price_high", label: "Price: High to Low" },
    { id: "most_bids", label: "Most Bids" },
  ];

  const hasActiveFilters = search || selectedCategories.length > 0 || selectedStatus !== "all";

  // Skeleton Loader for initial loading
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded-md" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-full" />
              <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-xl" />
            </div>
          </div>
        </div>
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[3/4] bg-white border border-[#CBCCC9] rounded-xl overflow-hidden p-4 flex flex-col gap-4">
              <div className="w-full aspect-square bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
              <div className="flex justify-between mt-auto">
                <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Search Result Info & Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-[#111111] font-jetbrains uppercase tracking-tight flex items-center gap-2">
              {search ? `Search results for "${search}"` : "Explore Auctions"}
              {isFetching && <Loader2 className="w-5 h-5 text-[#FF8400] animate-spin ml-2" />}
            </h1>
            <p className="text-sm text-[#666666]">
              {auctions.length} item{auctions.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="relative flex items-center gap-2">
              <span className="text-xs font-bold text-[#666666] uppercase tracking-wider">Sort:</span>
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-[#CBCCC9] rounded-full hover:border-[#FF8400] bg-white transition-all min-w-[180px]"
              >
                <span className="text-sm font-bold text-[#111111] flex-1 text-left">
                  {sortOptions.find(opt => opt.id === sortBy)?.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#111111] transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-[#CBCCC9] rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          onSortChange(option.id);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          sortBy === option.id ? "bg-[#FF8400] text-white" : "text-[#111111] hover:bg-[#F2F3F0]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white border-2 border-[#CBCCC9] rounded-xl p-1">
              <button
                onClick={() => onViewModeChange("grid")}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === "grid"
                    ? "bg-[#111111] text-white"
                    : "text-[#666666] hover:bg-[#F2F3F0]"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onViewModeChange("list")}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === "list"
                    ? "bg-[#111111] text-white"
                    : "text-[#666666] hover:bg-[#F2F3F0]"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 py-2">
            <span className="text-xs font-bold text-[#666666] uppercase tracking-wider mr-1">Active:</span>
            {search && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-[#111111] rounded-full text-xs font-bold">
                <span>Search: {search}</span>
              </div>
            )}
            {selectedCategories.map(cat => (
              <div key={cat} className="flex items-center gap-1.5 px-3 py-1 bg-[#F2F3F0] border-2 border-[#CBCCC9] rounded-full text-xs font-bold capitalize">
                <span>{cat}</span>
              </div>
            ))}
            {selectedStatus !== 'all' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F2F3F0] border-2 border-[#CBCCC9] rounded-full text-xs font-bold capitalize">
                <span>{selectedStatus.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid Content */}
      <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
        {auctions.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {auctions.map((auction: any) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-32 bg-white rounded-2xl border-2 border-dashed border-[#CBCCC9]">
            <div className="relative">
              <div className="w-24 h-24 bg-[#F2F3F0] rounded-full flex items-center justify-center">
                <SearchIcon className="w-10 h-10 text-[#CBCCC9]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-[#CBCCC9]">
                <X className="w-6 h-6 text-[#FF4D4D]" />
              </div>
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-xl font-bold text-[#111111] uppercase font-jetbrains mb-2">No results found</h3>
              <p className="text-[#666666] text-sm leading-relaxed">
                We couldn't find any auctions matching your search criteria. Try using more general keywords or adjusting your filters.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
