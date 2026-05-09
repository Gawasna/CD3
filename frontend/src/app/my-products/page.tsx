'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Image, Eye, Edit, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

type ProductStatus = 'active' | 'ended' | 'draft';

interface Product {
  id: string;
  title: string;
  status: ProductStatus;
  bids: number;
  currentPrice: string;
  image?: string;
}

export default function MyProductsPage() {
  const t = useTranslations('myProducts');
  const [activeTab, setActiveTab] = useState<ProductStatus>('active');

  // Mock data
  const products: Product[] = [
    { id: '1', title: 'MacBook Pro M1 - Mint Condition', status: 'active', bids: 12, currentPrice: '1.2 ETH' },
    { id: '2', title: 'Vintage Camera Canon AE-1', status: 'active', bids: 8, currentPrice: '0.8 ETH' },
    { id: '3', title: 'Gaming PC RTX 4090', status: 'draft', bids: 0, currentPrice: '2.5 ETH' },
  ];

  const filteredProducts = products.filter(p => p.status === activeTab);

  const getStatusBadge = (status: ProductStatus) => {
    const styles = {
      active: 'bg-[#DFE6E1] text-[#004D1A]',
      ended: 'bg-[#E9E3D8] text-[#804200]',
      draft: 'bg-[#E7E8E5] text-[#111111]',
    };

    const labels = {
      active: 'LIVE',
      ended: 'ENDED',
      draft: 'DRAFT',
    };

    return (
      <span className={`px-3 py-1 rounded-full font-jetbrains text-xs font-bold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-8 p-12 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">
        My Products
      </h1>

      {/* Tabs */}
      <div className="flex gap-4">
        {(['active', 'ended', 'draft'] as ProductStatus[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-full font-jetbrains text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-[#FF8400] text-[#111111]'
                : 'bg-[#E7E8E5] text-[#111111] hover:bg-[#CBCCC9]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Products List */}
      <div className="flex flex-col gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-6 p-6 bg-white rounded-2xl border border-[#CBCCC9]"
          >
            {/* Image */}
            <div className="w-[120px] h-[120px] bg-[#E7E8E5] rounded-2xl flex items-center justify-center flex-shrink-0">
              <Image className="w-10 h-10 text-[#666666]" />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col gap-2">
              <h3 className="font-jetbrains text-xl font-bold text-[#111111]">
                {product.title}
              </h3>
              <div className="flex items-center gap-4">
                {getStatusBadge(product.status)}
                <span className="font-geist text-sm text-[#666666]">
                  {product.bids} bids
                </span>
                <span className="font-jetbrains text-base font-semibold text-[#111111]">
                  Current: {product.currentPrice}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href={`/auctions/${product.id}`}
                className="px-4 py-2.5 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] text-[#111111] font-jetbrains text-sm font-medium hover:bg-[#CBCCC9] transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </Link>
              <Link
                href={`/auctions/${product.id}/edit`}
                className="px-4 py-2.5 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button className="px-4 py-2.5 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] text-[#111111] font-jetbrains text-sm font-medium hover:bg-[#CBCCC9] transition-colors flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                End Auction
              </button>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-[#666666] font-geist">
            No products found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
