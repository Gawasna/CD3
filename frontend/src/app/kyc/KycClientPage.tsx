'use client';

import { useRouter } from 'next/navigation';
import { KycVerify } from '@/features/kyc';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { KycStatus } from '@/features/kyc';

export default function KycClientPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !_hasHydrated) {
    return (
      <main className="min-h-screen bg-[#F2F3F0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF8400] animate-spin" />
      </main>
    );
  }

  const walletAddress = user?.walletAddress || '0x0000000000000000000000000000000000000000';
  const initialStatus = (user?.kycStatus as KycStatus) || 'NONE';

  return (
    <main className="min-h-screen bg-[#F2F3F0] py-10 px-4">
      <KycVerify
        initialStatus={initialStatus}
        walletAddress={walletAddress}
        onComplete={() => {
          router.push('/profile');
        }}
      />
    </main>
  );
}
