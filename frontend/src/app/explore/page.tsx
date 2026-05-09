"use client";

import { useState } from "react";
import { ExploreHeader } from "@/features/auction/components/ExploreHeader";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <ExploreHeader />

      {/* Main Content */}
      <div className="flex gap-12 px-12 py-12">
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
