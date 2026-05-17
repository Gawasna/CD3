'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { profileApi } from '@/services/api/profile';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/auth/ToastContainer';

interface FollowButtonProps {
  userId: string;
  className?: string;
  onToggle?: (isFollowing: boolean) => void;
}

export default function FollowButton({ userId, className = '', onToggle }: FollowButtonProps) {
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isSelf = currentUser?.id === userId;

  useEffect(() => {
    if (!currentUser || isSelf) {
      return;
    }

    const checkStatus = async () => {
      try {
        const { isFollowing: status } = await profileApi.checkFollowing(userId);
        setIsFollowing(status);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkStatus();
  }, [currentUser, userId, isSelf]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      showToast('warning', 'Please login to follow users');
      return;
    }

    if (isSelf) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await profileApi.unfollow(userId);
        setIsFollowing(false);
        showToast('success', 'Unfollowed user');
        onToggle?.(false);
      } else {
        await profileApi.follow(userId);
        setIsFollowing(true);
        showToast('success', 'Following user');
        onToggle?.(true);
      }
    } catch (error: any) {
      console.error('Follow error:', error);
      showToast('error', (error as any).message || 'Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSelf) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 rounded-full transition-all font-jetbrains text-sm font-semibold border ${
        isFollowing 
          ? 'bg-[#CBCCC9] text-[#111111] border-[#CBCCC9] hover:bg-[#B8B9B6]' 
          : 'bg-[#FF8400] text-[#111111] border-[#FF8400] hover:opacity-90'
      } disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Followed
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </button>
  );
}
