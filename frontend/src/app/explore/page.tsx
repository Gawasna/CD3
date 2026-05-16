"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ExploreFilters } from "@/features/auction/components/ExploreFilters";
import { AuctionGrid } from "@/features/auction/components/AuctionGrid";
import { useTranslations } from "next-intl";

export default function ExplorePage() {
  const t = useTranslations("explore");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- Derived state from URL (source of truth) ---
  const urlSearch = searchParams.get("search") || "";
  const urlCategories = searchParams.get("categories")
    ? searchParams.get("categories")!.split(",").filter(Boolean)
    : [];
  const urlStatus = searchParams.get("status") || "all";
  const urlSortBy = searchParams.get("sortBy") || "newest";
  const urlViewMode = (searchParams.get("viewMode") as "grid" | "list") || "grid";

  // Debounce search so AuctionGrid does not re-fetch on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(urlSearch), 500);
    return () => clearTimeout(timer);
  }, [urlSearch]);

  // --- Central updater: pushes new filter state into URL ---
  const updateFilters = useCallback(
    (updates: {
      categories?: string[];
      status?: string;
      sortBy?: string;
      viewMode?: "grid" | "list";
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.categories !== undefined) {
        if (updates.categories.length > 0) {
          params.set("categories", updates.categories.join(","));
        } else {
          params.delete("categories");
        }
      }

      if (updates.status !== undefined) {
        if (updates.status && updates.status !== "all") {
          params.set("status", updates.status);
        } else {
          params.delete("status");
        }
      }

      if (updates.sortBy !== undefined) {
        if (updates.sortBy && updates.sortBy !== "newest") {
          params.set("sortBy", updates.sortBy);
        } else {
          params.delete("sortBy");
        }
      }

      if (updates.viewMode !== undefined) {
        if (updates.viewMode !== "grid") {
          params.set("viewMode", updates.viewMode);
        } else {
          params.delete("viewMode");
        }
      }

      // Use replace to avoid polluting history on every filter toggle
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="min-h-screen bg-[#F2F3F0]">
      {/* Main Content */}
      <div className="flex gap-6 px-8 py-8 max-w-[1600px] mx-auto">
        {/* Sidebar Filters */}
        <ExploreFilters
          selectedCategories={urlCategories}
          onCategoriesChange={(categories) => updateFilters({ categories })}
          selectedStatus={urlStatus}
          onStatusChange={(status) => updateFilters({ status })}
        />

        {/* Auction Grid */}
        <AuctionGrid
          sortBy={urlSortBy}
          onSortChange={(sortBy) => updateFilters({ sortBy })}
          viewMode={urlViewMode}
          onViewModeChange={(viewMode) => updateFilters({ viewMode })}
          selectedCategories={urlCategories}
          selectedStatus={urlStatus}
          search={debouncedSearch}
        />
      </div>
    </div>
  );
}
