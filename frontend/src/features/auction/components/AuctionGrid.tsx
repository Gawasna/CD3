"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Grid3x3, List } from "lucide-react";
import { AuctionCard } from "./AuctionCard";
import { useTranslations } from "next-intl";

interface AuctionGridProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  selectedCategories: string[];
  selectedStatus: string;
}

// Mock data - replace with actual API call
const mockAuctions = [
  {
    id: "1",
    title: "Rolex Submariner 2023",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=300&fit=crop",
    currentBid: "2.5",
    bids: 24,
    timeLeft: "2h 34m left",
    status: "live" as const,
    category: "collectibles",
  },
  {
    id: "2",
    title: "Vintage Camera Collection",
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop",
    currentBid: "1.2",
    bids: 18,
    timeLeft: "45m left",
    status: "ending" as const,
    category: "electronics",
  },
  {
    id: "3",
    title: "Limited Edition Sneakers",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    currentBid: "0.8",
    bids: 32,
    timeLeft: "5h 12m left",
    status: "live" as const,
    category: "fashion",
  },
  {
    id: "4",
    title: "Abstract Digital Art",
    image: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=400&h=300&fit=crop",
    currentBid: "3.5",
    bids: 56,
    timeLeft: "1h 20m left",
    status: "live" as const,
    category: "art",
  },
  {
    id: "5",
    title: "Designer Handbag",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=300&fit=crop",
    currentBid: "1.8",
    bids: 41,
    timeLeft: "3h 45m left",
    status: "live" as const,
    category: "fashion",
  },
  {
    id: "6",
    title: "Gaming Console Bundle",
    image: "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400&h=300&fit=crop",
    currentBid: "0.5",
    bids: 67,
    timeLeft: "6h 20m left",
    status: "live" as const,
    category: "electronics",
  },
  {
    id: "7",
    title: "Rare Comic Book",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=300&fit=crop",
    currentBid: "2.2",
    bids: 89,
    timeLeft: "30m left",
    status: "ending" as const,
    category: "collectibles",
  },
  {
    id: "8",
    title: "Antique Furniture",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    currentBid: "4.0",
    bids: 12,
    timeLeft: "4h 15m left",
    status: "live" as const,
    category: "collectibles",
  },
  {
    id: "9",
    title: "Vintage Vinyl Records",
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&h=300&fit=crop",
    currentBid: "0.6",
    bids: 28,
    timeLeft: "2h 50m left",
    status: "live" as const,
    category: "collectibles",
  },
  {
    id: "10",
    title: "Smart Home Device",
    image: "https://images.unsplash.com/photo-1558089687-e1c6e5b1e8e0?w=400&h=300&fit=crop",
    currentBid: "0.3",
    bids: 95,
    timeLeft: "7h 30m left",
    status: "live" as const,
    category: "electronics",
  },
  {
    id: "11",
    title: "Luxury Perfume Set",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop",
    currentBid: "1.1",
    bids: 37,
    timeLeft: "4h 05m left",
    status: "live" as const,
    category: "fashion",
  },
  {
    id: "12",
    title: "Professional Camera Lens",
    image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=300&fit=crop",
    currentBid: "5.5",
    bids: 103,
    timeLeft: "15m left",
    status: "ending" as const,
    category: "electronics",
  },
];

export function AuctionGrid({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedCategories,
  selectedStatus,
}: AuctionGridProps) {
  const t = useTranslations("explore");
  const [filteredAuctions, setFilteredAuctions] = useState(mockAuctions);

  useEffect(() => {
    let filtered = [...mockAuctions];

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((auction) =>
        selectedCategories.includes(auction.category)
      );
    }

    // Filter by status
    if (selectedStatus === "live") {
      filtered = filtered.filter((auction) => auction.status === "live");
    } else if (selectedStatus === "ending_soon") {
      filtered = filtered.filter((auction) => auction.status === "ending");
    }

    // Sort
    if (sortBy === "ending_soon") {
      filtered.sort((a, b) => {
        const timeA = parseTimeLeft(a.timeLeft);
        const timeB = parseTimeLeft(b.timeLeft);
        return timeA - timeB;
      });
    } else if (sortBy === "highest_bid") {
      filtered.sort((a, b) => parseFloat(b.currentBid) - parseFloat(a.currentBid));
    } else if (sortBy === "most_bids") {
      filtered.sort((a, b) => b.bids - a.bids);
    }

    setFilteredAuctions(filtered);
  }, [selectedCategories, selectedStatus, sortBy]);

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
    <div className="flex-1 flex flex-col gap-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111111] font-mono">
          Explore ({filteredAuctions.length} Items)
        </h1>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#666666]">Sort by:</span>
            <button className="flex items-center gap-2 px-4 py-2 border border-[#CBCCC9] rounded-full hover:bg-[#E7E8E5] transition-colors">
              <span className="text-sm text-[#111111]">
                {sortBy === "ending_soon" && "Ending Soon"}
                {sortBy === "highest_bid" && "Highest Bid"}
                {sortBy === "most_bids" && "Most Bids"}
              </span>
              <ChevronDown className="w-4 h-4 text-[#666666]" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors ${
                viewMode === "grid"
                  ? "bg-[#E7E8E5]"
                  : "bg-transparent hover:bg-[#E7E8E5]/50"
              }`}
            >
              <Grid3x3
                className={`w-5 h-5 ${
                  viewMode === "grid" ? "text-[#111111]" : "text-[#666666]"
                }`}
              />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors ${
                viewMode === "list"
                  ? "bg-[#E7E8E5]"
                  : "bg-transparent hover:bg-[#E7E8E5]/50"
              }`}
            >
              <List
                className={`w-5 h-5 ${
                  viewMode === "list" ? "text-[#111111]" : "text-[#666666]"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-6">
        {filteredAuctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
    </div>
  );
}
