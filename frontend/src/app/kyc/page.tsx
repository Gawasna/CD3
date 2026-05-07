import type { Metadata } from 'next';
import KycClientPage from './KycClientPage';

export const metadata: Metadata = {
  title: 'KYC Verification | P2P Auction',
  description:
    'Complete your mock identity verification to unlock full marketplace access.',
};

/**
 * KYC page — renders trạng thái tương ứng (NONE / PENDING / APPROVED / REJECTED).
 * Status thực tế được fetch từ API thông qua AuthStore trong KycClientPage.
 */
export default function KycPage() {
  return <KycClientPage />;
}
