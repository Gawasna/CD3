'use client';

import { useState } from 'react';
import type { KycStatus } from './types';
import { KycNone } from './components/KycNone';
import { KycPending } from './components/KycPending';
import { KycApproved } from './components/KycApproved';
import { KycRejected } from './components/KycRejected';
import { useAuthStore } from '@/store/auth.store';
import { kycApi } from '@/services/api/kyc';
import { fetchMe } from '@/services/api/auth';
import { useEffect } from 'react';

interface KycVerifyProps {
  /**
   * Initial status từ backend. Nếu không truyền, default là 'NONE'.
   * Trong thực tế sẽ lấy từ API / zustand store.
   */
  initialStatus?: KycStatus;
  walletAddress?: string;
  onComplete?: () => void;
}

export function KycVerify({
  initialStatus = 'NONE',
  walletAddress = '0x1234...abcd',
  onComplete,
}: KycVerifyProps) {
  const [status, setStatus] = useState<KycStatus>(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  switch (status) {
    case 'NONE':
      return (
        <KycNone
          walletAddress={walletAddress}
          onSubmit={async (data) => {
            try {
              await kycApi.submitKyc(data);
              useAuthStore.getState().updateUser({ kycStatus: 'PENDING' });
              setStatus('PENDING');
            } catch (err: any) {
              console.error(err);
              alert(err.message || 'Failed to submit KYC');
            }
          }}
        />
      );

    case 'PENDING':
      return (
        <KycPending
          walletAddress={walletAddress}
          onRefreshStatus={async () => {
            try {
              const token = useAuthStore.getState().token;
              if (token) {
                const user = await fetchMe(token);
                useAuthStore.getState().updateUser(user);
                setStatus(user.kycStatus as KycStatus);
              }
            } catch (err: any) {
              console.error(err);
              alert('Failed to refresh status');
            }
          }}
          onBackToDashboard={onComplete}
        />
      );

    case 'APPROVED':
      return (
        <KycApproved
          walletAddress={walletAddress}
          onContinue={onComplete}
        />
      );

    case 'REJECTED':
      return (
        <KycRejected
          walletAddress={walletAddress}
          onSaveChanges={() => {
            // TODO: persist draft
          }}
          onResubmit={() => setStatus('NONE')}
        />
      );
  }
}
