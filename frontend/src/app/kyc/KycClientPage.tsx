'use client';

import { useRouter } from 'next/navigation';
import { KycVerify } from '@/features/kyc';
import { useAuthStore } from '@/store/auth.store';
import { fetchMe } from '@/services/api/auth';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { KycStatus } from '@/features/kyc';

export default function KycClientPage() {
  const router = useRouter();
  const { user, token, _hasHydrated, updateUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch trạng thái user mới nhất từ server
  const { data: latestUser, isLoading: isFetchingMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => fetchMe(token!),
    enabled: !!token && _hasHydrated,
    staleTime: 0, // Luôn fetch mới để cập nhật trạng thái KYC
  });

  // Cập nhật store nếu có dữ liệu mới từ server
  useEffect(() => {
    if (latestUser) {
      updateUser(latestUser);
    }
  }, [latestUser, updateUser]);

  if (!mounted || !_hasHydrated || isFetchingMe) {
    return (
      <main className="min-h-screen bg-[#F2F3F0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF8400] animate-spin" />
      </main>
    );
  }

  const walletAddress = latestUser?.walletAddress || user?.walletAddress || '0x0000000000000000000000000000000000000000';
  const currentStatus = (latestUser?.kycStatus || user?.kycStatus || 'NONE') as KycStatus;

  return (
    <main className="min-h-screen bg-[#F2F3F0] py-10 px-4">
      <KycVerify
        initialStatus={currentStatus}
        walletAddress={walletAddress}
        onComplete={() => {
          router.push('/profile');
        }}
      />
    </main>
  );
}
