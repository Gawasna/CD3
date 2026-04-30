import type { Metadata } from 'next';
import { KycVerify } from '@/features/kyc';

export const metadata: Metadata = {
  title: 'KYC Verification | P2P Auction',
  description:
    'Complete your mock identity verification to unlock full marketplace access.',
};

/**
 * KYC page — renders trạng thái tương ứng (NONE / PENDING / APPROVED / REJECTED).
 * Status thực tế nên được fetch từ API và truyền vào KycVerify qua prop.
 */
export default function KycPage() {
  return (
    <main className="min-h-screen bg-[#F2F3F0] py-10 px-4">
      {/* Dev-only status switcher — chỉ hiển thị ở development */}
      <KycVerify
        /* TODO: thay bằng status thật từ API:
           const { data: kycStatus } = useKycStatus(wallet.address)
           initialStatus={kycStatus ?? 'NONE'}
        */
        initialStatus="NONE"
        walletAddress="0x1234...abcd"
        onComplete={() => {
          // TODO: navigate('/dashboard')
        }}
      />
    </main>
  );
}
