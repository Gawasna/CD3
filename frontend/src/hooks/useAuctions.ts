import { useQuery } from '@tanstack/react-query';
import { listAuctions, type Auction } from '@/services/api/auction';

type UseAuctionsParams = {
  variant?: 'ending-soon' | 'live' | 'upcoming';
  status?: string;
  page?: number;
  limit?: number;
};

export function useAuctions(params: UseAuctionsParams = {}) {
  return useQuery({
    queryKey: ['auctions', params],
    queryFn: () => listAuctions(params),
    staleTime: 30000, // 30 seconds
  });
}
