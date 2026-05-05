'use client';

import { useState } from 'react';
import type { KycStatus } from './types';
import { KycNone } from './components/KycNone';
import { KycPending } from './components/KycPending';
import { KycApproved } from './components/KycApproved';
import { KycRejected } from './components/KycRejected';

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

  switch (status) {
    case 'NONE':
      return (
        <KycNone
          walletAddress={walletAddress}
          onSubmit={() => setStatus('PENDING')}
        />
      );

    case 'PENDING':
      return (
        <KycPending
          walletAddress={walletAddress}
          onApprove={() => setStatus('APPROVED')}
          onReject={() => setStatus('REJECTED')}
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
          onResubmit={() => setStatus('PENDING')}
        />
      );
  }
}
