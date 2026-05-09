"use client";

import { Search, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ExploreHeader() {
  const t = useTranslations("explore");

  return (
    <header className="flex items-center justify-between h-[72px] px-8 bg-background border-b border-border">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Box className="w-8 h-8 text-primary" />
        <span className="text-[22px] font-extrabold tracking-wider text-foreground font-mono">
          P2P AUCTION
        </span>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 px-4 h-10 w-[400px] border border-border rounded-full">
        <Search className="w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search for items, collections..."
          className="flex-1 bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Connect Wallet Button */}
      <div className="flex items-center gap-4">
        <Button
          className="h-10 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90"
        >
          Connect Wallet
        </Button>
      </div>
    </header>
  );
}
