"use client";

import Image from "next/image";
import { Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AuctionCardProps {
  auction: {
    id: string;
    title: string;
    image: string;
    currentBid: string;
    bids: number;
    timeLeft: string;
    status: "live" | "ending";
    category: string;
  };
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/auctions/${auction.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col w-[280px] bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {/* Image */}
      <div className="relative w-full h-[200px] bg-secondary">
        <Image
          src={auction.image}
          alt={auction.title}
          fill
          className="object-cover"
          sizes="280px"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4">
        {/* Title */}
        <h3 className="text-base font-semibold text-foreground font-mono line-clamp-1">
          {auction.title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold font-mono ${
              auction.status === "live"
                ? "bg-[#DFE6E1] text-[#004D1A]"
                : "bg-[#E9E3D8] text-[#804200]"
            }`}
          >
            {auction.status === "live" ? "LIVE" : "ENDING"}
          </span>

          {/* Time Left */}
          <div className="flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">
              {auction.timeLeft}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border" />

        {/* Price & Bids */}
        <div className="flex items-center justify-between">
          {/* Current Bid */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Current Bid</span>
            <span className="text-lg font-bold text-primary font-mono">
              {auction.currentBid} ETH
            </span>
          </div>

          {/* Bids Count */}
          <div className="flex flex-col gap-1 items-end">
            <span className="text-xs text-muted-foreground">Bids</span>
            <span className="text-lg font-bold text-foreground font-mono">
              {auction.bids}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
