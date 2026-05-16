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
  { id: "furniture", label: "Furniture" },
  { id: "collectibles", label: "Collectibles" },
  { id: "other", label: "Other" },
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
    const isSelected = selectedCategories.includes(categoryId);
    if (isSelected) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  return (
    <aside className="w-[240px] flex-shrink-0 sticky top-[104px] h-[calc(100vh-136px)] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex flex-col gap-8">
        {/* Title */}
        <h2 className="text-xl font-bold text-[#111111] font-jetbrains uppercase tracking-tight">Filters</h2>

        {/* Categories */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Categories</h3>
          <div className="flex flex-col gap-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="group flex items-center gap-3 cursor-pointer"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                      selectedCategories.includes(category.id)
                        ? "bg-[#FF8400] border-[#FF8400] shadow-[0_0_10px_rgba(255,132,0,0.3)]"
                        : "bg-white border-[#CBCCC9] group-hover:border-[#FF8400]"
                    }`}
                  />
                  {selectedCategories.includes(category.id) && (
                    <svg
                      className="absolute w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  selectedCategories.includes(category.id) ? "text-[#111111]" : "text-[#666666] group-hover:text-[#111111]"
                }`}>
                  {category.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Status</h3>
          <div className="flex flex-col gap-3">
            {statuses.map((status) => (
              <label
                key={status.id}
                className="group flex items-center gap-3 cursor-pointer"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="auctionStatus"
                    className="sr-only"
                    checked={selectedStatus === status.id}
                    onChange={() => onStatusChange(status.id)}
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                      selectedStatus === status.id
                        ? "border-[#FF8400] bg-white shadow-[0_0_10px_rgba(255,132,0,0.3)]"
                        : "border-[#CBCCC9] bg-white group-hover:border-[#FF8400]"
                    }`}
                  >
                    {selectedStatus === status.id && (
                      <div className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-[#FF8400]" />
                    )}
                  </div>
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  selectedStatus === status.id ? "text-[#111111]" : "text-[#666666] group-hover:text-[#111111]"
                }`}>
                  {status.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
