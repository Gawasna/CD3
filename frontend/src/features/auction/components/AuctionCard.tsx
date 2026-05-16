"use client";

import { Clock3, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuctionImage } from "./AuctionImage";

interface AuctionCardProps {
  auction: {
    id: string;
    title: string;
    image: string;
    currentBid: string;
    bids: number;
    timeLeft: string;
    status: "live" | "ending" | "upcoming" | "ended";
    category: string;
  };
}

// Generate gradient based on category
const getCategoryGradient = (category: string) => {
  const gradients: Record<string, string> = {
    electronics: "from-blue-400 to-blue-600",
    fashion: "from-pink-400 to-pink-600",
    collectibles: "from-purple-400 to-purple-600",
    art: "from-orange-400 to-orange-600",
  };
  return gradients[category] || "from-gray-400 to-gray-600";
};

export function AuctionCard({ auction }: AuctionCardProps) {
  const router = useRouter();
  const isPlaceholder = auction.image.startsWith("/placeholder");

  const handleClick = () => {
    router.push(`/auctions/${auction.id}`);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "live":
        return "bg-[#DFE6E1] text-[#004D1A]";
      case "ending":
        return "bg-[#E9E3D8] text-[#804200]";
      case "upcoming":
        return "bg-[#E7E8E5] text-[#111111] border border-[#CBCCC9]";
      case "ended":
        return "bg-[#F2F3F0] text-[#666666]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "live": return "LIVE";
      case "ending": return "ENDING";
      case "upcoming": return "UPCOMING";
      case "ended": return "ENDED";
      default: return status.toUpperCase();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col bg-white border border-[#CBCCC9] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {/* Image */}
      <div className="relative w-full h-[180px] overflow-hidden">
        {isPlaceholder ? (
          // Placeholder gradient
          <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(auction.category)} flex items-center justify-center`}>
            <ImageIcon className="w-12 h-12 text-white/50" />
          </div>
        ) : (
          // Real image with auto thumbnail & fallback handling
          <AuctionImage
            filename={auction.image}
            alt={auction.title}
            fill
            className="object-cover"
            sizes="280px"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 p-3.5">
        {/* Title */}
        <h3 className="text-sm font-semibold text-[#111111] font-mono line-clamp-1">
          {auction.title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${getStatusStyles(auction.status)}`}
          >
            {getStatusLabel(auction.status)}
          </span>

          {/* Time Left */}
          <div className="flex items-center gap-1">
            <Clock3 className="w-3 h-3 text-[#666666]" />
            <span className="text-xs text-[#666666]">
              {auction.timeLeft}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#CBCCC9]" />

        {/* Price & Bids */}
        <div className="flex items-center justify-between">
          {/* Current Bid */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[#666666]">Current Bid</span>
            <span className="text-base font-bold text-[#FF8400] font-mono">
              {auction.currentBid} ETH
            </span>
          </div>

          {/* Bids Count */}
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-[10px] text-[#666666]">Bids</span>
            <span className="text-base font-bold text-[#111111] font-mono">
              {auction.bids}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
