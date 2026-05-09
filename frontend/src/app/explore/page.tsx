"use client";

import { useState } from "react";
import { ExploreFilters } from "@/features/auction/components/ExploreFilters";
import { AuctionGrid } from "@/features/auction/components/AuctionGrid";
import { useTranslations } from "next-intl";

export default function ExplorePage() {
  const t = useTranslations("explore");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("ending_soon");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="min-h-screen bg-[#F2F3F0]">
      {/* Main Content */}
      <div className="flex gap-6 px-8 py-8 max-w-[1600px] mx-auto">
        {/* Sidebar Filters */}
        <ExploreFilters
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />

        {/* Auction Grid */}
        <AuctionGrid
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCategories={selectedCategories}
          selectedStatus={selectedStatus}
        />
      </div>
    </div>
  );
}
