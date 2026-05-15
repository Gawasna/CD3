'use client';

import Link from 'next/link';
import AuctionCard, { AuctionCardVariant } from './AuctionCard';

interface AuctionItem {
  id: string | number;
  title: string;
  seller: string;
  price: string;
  timeInfo?: string;
  imageUrl?: string;
}

interface AuctionSectionProps {
  title: string;
  viewAllText: string;
  viewAllHref?: string;
  items: AuctionItem[];
  variant: AuctionCardVariant;
}

export default function AuctionSection({
  title,
  viewAllText,
  viewAllHref = '/explore',
  items,
  variant,
}: AuctionSectionProps) {
  return (
    <section className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-end w-full">
        <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="font-jetbrains text-sm font-semibold text-[#FF8400] hover:underline"
        >
          {viewAllText}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full overflow-hidden">
        {items.map((item) => (
          <AuctionCard
            key={item.id}
            id={item.id}
            title={item.title}
            seller={item.seller}
            price={item.price}
            variant={variant}
            timeInfo={item.timeInfo}
            imageUrl={item.imageUrl}
          />
        ))}
      </div>
    </section>
  );
}
