'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { addToWatchlist, removeFromWatchlist, getWatchlist } from '@/services/api/auction';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/auth/ToastContainer';

interface WatchlistButtonProps {
  auctionId: string;
  className?: string;
  onToggle?: (isWatched: boolean) => void;
}

export default function WatchlistButton({ auctionId, className = '', onToggle }: WatchlistButtonProps) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [isWatched, setIsWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkStatus = async () => {
      try {
        const watchlist = await getWatchlist({ limit: 100 });
        const found = watchlist.data.some(a => a.id === auctionId);
        setIsWatched(found);
      } catch (error) {
        console.error('Error checking watchlist status:', error);
      }
    };

    checkStatus();
  }, [user, auctionId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast('warning', 'Please login to add to watchlist');
      return;
    }

    setIsLoading(true);
    try {
      if (isWatched) {
        await removeFromWatchlist(auctionId);
        setIsWatched(false);
        showToast('success', 'Removed from watchlist');
        onToggle?.(false);
      } else {
        await addToWatchlist(auctionId);
        setIsWatched(true);
        showToast('success', 'Added to watchlist');
        onToggle?.(true);
      }
    } catch (error: any) {
      console.error('Watchlist error:', error);
      showToast('error', error.message || 'Failed to update watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2 rounded-full transition-all ${
        isWatched 
          ? 'bg-[#FFE5CC] text-[#FF8400] border-[#FF8400]' 
          : 'bg-white/80 text-[#666666] border-[#CBCCC9] hover:bg-white'
      } border shadow-sm flex items-center justify-center disabled:opacity-50 ${className}`}
      title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Heart className={`w-5 h-5 ${isWatched ? 'fill-[#FF8400]' : ''}`} />
    </button>
  );
}
