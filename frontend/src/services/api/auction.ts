import { authFetch } from './client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ── Types ─────────────────────────────────────────────────────────────────

export type AuctionCategory = 'ELECTRONICS' | 'FASHION' | 'FURNITURE' | 'COLLECTIBLES' | 'OTHER';
export type ShippingPayer = 'BUYER' | 'SELLER' | 'PLATFORM';
export type AuctionStatus = 'PENDING' | 'ACTIVE' | 'ENDED' | 'CANCELED' | 'FORFEITED';

export type Auction = {
  id: string;
  sellerId: string;
  onChainAuctionId: bigint | null;
  status: AuctionStatus;
  title: string;
  description: string;
  category: AuctionCategory;
  startingPriceWei: string;
  buyNowPriceWei: string | null;
  shippingCostWei: string;
  shippingPayer: ShippingPayer;
  endTime: string;
  durationSeconds: number;
  ipfsCid: string | null;
  seller: {
    id: string;
    walletAddress: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  winner: {
    id: string;
    walletAddress: string;
    displayName: string | null;
  } | null;
  _count: {
    bids: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type CreateAuctionPayload = {
  title: string;
  description: string;
  category: AuctionCategory;
  startingPriceWei: string;
  buyNowPriceWei?: string;
  durationSeconds: number;
  shippingCostWei: string;
  shippingPayer: ShippingPayer;
  createTxHash: string;
  mediaKeys: string[];
};

export type ListAuctionsResponse = {
  data: Auction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// ── API Functions ─────────────────────────────────────────────────────────

/**
 * Upload media files cho auction.
 * Trả về danh sách filenames.
 */
export async function uploadAuctionMedia(files: File[]): Promise<{ filenames: string[] }> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('media', file);
  });

  return authFetch<{ filenames: string[] }>('/v1/auctions/media', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Tạo auction mới.
 */
export async function createAuction(payload: CreateAuctionPayload): Promise<{ auctionId: string }> {
  return authFetch<{ auctionId: string }>('/v1/auctions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Lấy danh sách auctions với filter và pagination.
 */
export async function listAuctions(params: {
  status?: string;
  variant?: string;
  page?: number;
  limit?: number;
}): Promise<ListAuctionsResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.variant) searchParams.set('variant', params.variant);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/v1/auctions?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch auctions: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Lấy chi tiết auction theo ID.
 */
export async function getAuction(auctionId: string): Promise<{ auction: Auction }> {
  const res = await fetch(`${API_BASE}/v1/auctions/${auctionId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch auction: ${res.statusText}`);
  }
  return res.json();
}
