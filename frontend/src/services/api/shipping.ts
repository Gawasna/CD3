import { authFetch } from './client';

export type ShippingStatus = 'PENDING' | 'SHIPPED' | 'CONFIRMED' | 'CANCELED';

export interface ShippingLog {
  id: string;
  auctionId: string;
  status: ShippingStatus;
  updatedById: string;
  notes: string | null;
  carrierName: string | null;
  trackingCode: string | null;
  createdAt: string;
  updatedBy: {
    displayName: string | null;
    walletAddress: string;
  };
}

export interface ShippingQuoteResponse {
  auctionId: string;
  feeWei: string;
  feeEth: string;
  carrier: string;
}

/**
 * Lấy lịch sử vận chuyển của auction.
 */
export async function getShippingHistory(auctionId: string): Promise<{ data: ShippingLog[] }> {
  return authFetch<{ data: ShippingLog[] }>(`/v1/shipping/${auctionId}/history`);
}

/**
 * Seller yêu cầu báo giá vận chuyển (giả lập).
 */
export async function getShippingQuote(auctionId: string, fromAddress: string, toAddress: string): Promise<ShippingQuoteResponse> {
  return authFetch<ShippingQuoteResponse>('/v1/shipping/quote', {
    method: 'POST',
    body: JSON.stringify({ auctionId, fromAddress, toAddress }),
  });
}
