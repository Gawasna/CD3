"use client";

import { useTranslations } from "next-intl";

interface ExploreFiltersProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

const categories = [
  { id: "electronics", label: "Electronics" },
  { id: "fashion", label: "Fashion" },
  { id: "collectibles", label: "Collectibles" },
  { id: "art", label: "Art" },
];

const statuses = [
  { id: "all", label: "All Auctions" },
  { id: "live", label: "Live Auctions" },
  { id: "ending_soon", label: "Ending Soon" },
];

export function ExploreFilters({
  selectedCategories,
  onCategoriesChange,
  selectedStatus,
  onStatusChange,
}: ExploreFiltersProps) {
  const t = useTranslations("explore");

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  return (
    <aside className="w-[280px] flex-shrink-0">
      <div className="flex flex-col gap-8">
        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground font-mono">Filters</h2>

        {/* Categories */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm text-muted-foreground">Categories</h3>
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded border border-border flex items-center justify-center ${
                    selectedCategories.includes(category.id)
                      ? "bg-primary border-primary"
                      : "bg-transparent"
                  }`}
                  onClick={() => toggleCategory(category.id)}
                >
                  {selectedCategories.includes(category.id) && (
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-foreground">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm text-muted-foreground">Status</h3>
          <div className="flex flex-col gap-2">
            {statuses.map((status) => (
              <label
                key={status.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full border border-border flex items-center justify-center ${
                    selectedStatus === status.id
                      ? "border-primary"
                      : "border-border"
                  }`}
                  onClick={() => onStatusChange(status.id)}
                >
                  {selectedStatus === status.id && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-sm text-foreground">{status.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
