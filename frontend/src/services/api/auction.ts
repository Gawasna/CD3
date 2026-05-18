import { authFetch } from './client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ── Types ─────────────────────────────────────────────────────────────────

export type AuctionCategory = 'ELECTRONICS' | 'FASHION' | 'FURNITURE' | 'COLLECTIBLES' | 'OTHER';
export type ShippingPayer = 'BUYER' | 'SELLER';
export type AuctionStatus = 'PENDING' | 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELED' | 'FORFEITED';
export type EscrowStatus = 'NONE' | 'AWAITING_SHIPMENT' | 'AWAITING_DELIVERY' | 'DISPUTED' | 'COMPLETED' | 'REFUNDED';

export type Bid = {
  id: string;
  amountWei: string;
  txHash: string;
  blockNumber: string | null;
  isWinning: boolean;
  createdAt: string;
  bidder: {
    id: string;
    walletAddress: string;
    displayName: string | null;
  };
};

export type Auction = {
  id: string;
  sellerId: string;
  winnerId?: string | null;
  onChainAuctionId: string | null; // Serialized as string for JSON compatibility
  status: AuctionStatus;
  escrowStatus: EscrowStatus;
  title: string;
  description: string;
  category: AuctionCategory;
  startingPriceWei: string;
  buyNowPriceWei: string | null;
  shippingCostWei: string;
  shippingPayer: ShippingPayer;
  startTime: string; // Added: Auction start time
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
    watchers: number; // Added: Watcher count
  };
  bids?: Bid[]; // Optional - only included in detail view
  createdAt: string;
  updatedAt: string;
};

export type CreateAuctionPayload = {
  title: string;
  description: string;
  category: AuctionCategory;
  startingPriceWei: string;
  buyNowPriceWei?: string;
  startTime?: string; // Added: Optional start time
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
  sellerId?: string;
  bidderId?: string;
  search?: string;
  categories?: string[];
  sortBy?: string;
  page?: number;
  limit?: number;
}): Promise<ListAuctionsResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.variant) searchParams.set('variant', params.variant);
  if (params.sellerId) searchParams.set('sellerId', params.sellerId);
  if (params.bidderId) searchParams.set('bidderId', params.bidderId);
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.categories && params.categories.length > 0) {
    searchParams.set('categories', params.categories.join(','));
  }
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/v1/auctions?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch auctions: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Ghi bid vào off-chain mirror sau khi BidPlaced event confirm on-chain.
 */
export async function recordBid(auctionId: string, payload: {
  onChainAuctionId: string;
  txHash: string;
  amountWei: string;
}): Promise<{ message: string }> {
  return authFetch<{ message: string }>(`/v1/auctions/${auctionId}/bids`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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

// ── Watchlist ─────────────────────────────────────────────────────────────

/**
 * Thêm auction vào watchlist.
 */
export async function addToWatchlist(auctionId: string): Promise<{ message: string }> {
  return authFetch<{ message: string }>(`/v1/auctions/${auctionId}/watchlist`, {
    method: 'POST',
  });
}

/**
 * Xóa auction khỏi watchlist.
 */
export async function removeFromWatchlist(auctionId: string): Promise<{ message: string }> {
  return authFetch<{ message: string }>(`/v1/auctions/${auctionId}/watchlist`, {
    method: 'DELETE',
  });
}

/**
 * Lấy danh sách watchlist của user hiện tại.
 */
export async function getWatchlist(params: {
  page?: number;
  limit?: number;
} = {}): Promise<ListAuctionsResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  return authFetch<ListAuctionsResponse>(`/v1/auctions/watchlist?${searchParams.toString()}`);
}
