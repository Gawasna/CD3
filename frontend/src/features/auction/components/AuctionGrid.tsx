"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Grid3x3, List, Loader2 } from "lucide-react";
import { AuctionCard } from "./AuctionCard";
import { useTranslations } from "next-intl";
import { useAuctions } from "@/hooks/useAuctions";
import { formatEther } from "viem";

interface AuctionGridProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  selectedCategories: string[];
  selectedStatus: string;
}

export function AuctionGrid({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedCategories,
  selectedStatus,
}: AuctionGridProps) {
  const t = useTranslations("explore");
  
  // Fetch real data
  const { data: auctionsData, isLoading } = useAuctions({
    status: selectedStatus === "all" ? undefined : (selectedStatus === "ending_soon" ? "ACTIVE" : selectedStatus.toUpperCase()),
    variant: selectedStatus === "ending_soon" ? "ending-soon" : undefined,
    limit: 50,
  });

  const [filteredAuctions, setFilteredAuctions] = useState<any[]>([]);

  useEffect(() => {
    if (!auctionsData?.data) return;

    let auctions = auctionsData.data.map((auction: any) => {
      let image = "";
      try {
        if (auction.ipfsCid) {
          const media = JSON.parse(auction.ipfsCid);
          if (Array.isArray(media) && media.length > 0) {
            image = media[0];
          }
        }
      } catch (e) {
        console.error("Failed to parse media for auction:", auction.id, e);
      }

      const end = new Date(auction.endTime).getTime();
      const now = new Date().getTime();
      const diff = end - now;
      let timeLeft = "Ended";
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timeLeft = `${hours}h ${mins}m left`;
      }

      return {
        id: auction.id,
        title: auction.title,
        image,
        currentBid: formatEther(BigInt(auction.startingPriceWei)),
        bids: auction._count?.bids || 0,
        timeLeft,
        status: auction.status === "ACTIVE" ? "live" : "ending",
        category: auction.category.toLowerCase(),
      };
    });

    // Filter by categories (if local filtering is still needed)
    if (selectedCategories.length > 0) {
      auctions = auctions.filter((auction) =>
        selectedCategories.includes(auction.category)
      );
    }

    // Sort
    if (sortBy === "ending_soon") {
      // already sorted by API if variant is ending-soon, but can re-sort locally
    } else if (sortBy === "highest_bid") {
      auctions.sort((a, b) => parseFloat(b.currentBid) - parseFloat(a.currentBid));
    } else if (sortBy === "most_bids") {
      auctions.sort((a, b) => b.bids - a.bids);
    }

    setFilteredAuctions(auctions);
  }, [auctionsData, selectedCategories, sortBy]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FF8400] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111] font-mono">
          Explore ({filteredAuctions.length} Items)
        </h1>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#666666]">Sort by:</span>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#CBCCC9] rounded-full hover:bg-[#E7E8E5] transition-colors">
              <span className="text-sm text-[#111111]">
                {sortBy === "ending_soon" && "Ending Soon"}
                {sortBy === "highest_bid" && "Highest Bid"}
                {sortBy === "most_bids" && "Most Bids"}
              </span>
              <ChevronDown className="w-4 h-4 text-[#666666]" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "grid"
                  ? "bg-[#E7E8E5]"
                  : "bg-transparent hover:bg-[#E7E8E5]/50"
              }`}
            >
              <Grid3x3
                className={`w-4 h-4 ${
                  viewMode === "grid" ? "text-[#111111]" : "text-[#666666]"
                }`}
              />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "list"
                  ? "bg-[#E7E8E5]"
                  : "bg-transparent hover:bg-[#E7E8E5]/50"
              }`}
            >
              <List
                className={`w-4 h-4 ${
                  viewMode === "list" ? "text-[#111111]" : "text-[#666666]"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredAuctions.length > 0 ? (
        <div className="grid grid-cols-4 gap-5">
          {filteredAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 bg-white rounded-xl border border-[#CBCCC9]">
          <span className="text-[#666666]">No auctions found matching your criteria.</span>
        </div>
      )}
    </div>
  );
}

  const parseTimeLeft = (timeLeft: string): number => {
    const match = timeLeft.match(/(\d+)([hm])/g);
    if (!match) return 0;
    
    let minutes = 0;
    match.forEach((part) => {
      const value = parseInt(part);
      if (part.includes("h")) {
        minutes += value * 60;
      } else {
        minutes += value;
      }
    });
    return minutes;
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111] font-mono">
          Explore ({filteredAuctions.length} Items)
        </h1>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#666666]">Sort by:</span>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#CBCCC9] rounded-full hover:bg-[#E7E8E5] transition-colors">
              <span className="text-sm text-[#111111]">
                {sortBy === "ending_soon" && "Ending Soon"}
                {sortBy === "highest_bid" && "Highest Bid"}
                {sortBy === "most_bids" && "Most Bids"}
              </span>
              <ChevronDown className="w-4 h-4 text-[#666666]" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "grid"
                  ? "bg-[#E7E8E5]"
                  : "bg-transparent hover:bg-[#E7E8E5]/50"
              }`}
            >
              <Grid3x3
                className={`w-4 h-4 ${
                  viewMode === "grid" ? "text-[#111111]" : "text-[#666666]"
                }`}
              />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "list"
                  ? "bg-[#E7E8E5]"
                  : "bg-transparent hover:bg-[#E7E8E5]/50"
              }`}
            >
              <List
                className={`w-4 h-4 ${
                  viewMode === "list" ? "text-[#111111]" : "text-[#666666]"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-5">
        {filteredAuctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
    </div>
  );
}
