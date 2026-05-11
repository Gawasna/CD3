'use client';

import { CircleCheck } from 'lucide-react';
import { KycStatusBadge } from './KycStatusBadge';

interface KycApprovedProps {
  walletAddress: string;
  onContinue?: () => void;
}

export function KycApproved({ walletAddress, onContinue }: KycApprovedProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2 flex-1">
          <h1 className="font-jetbrains text-[28px] font-bold text-[#111111]">
            KYC Verification
          </h1>
          <p className="text-sm text-[#666666]">
            Wallet{' '}
            <span className="font-mono">{walletAddress}</span> has passed the
            mock verification flow.
          </p>
        </div>
        <KycStatusBadge status="APPROVED" />
      </div>

      {/* Approved summary */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-6 flex flex-col gap-3">
        <CircleCheck className="text-[#10B981]" size={32} />
        <h2 className="font-jetbrains text-[22px] font-bold text-[#111111]">
          KYC approved for demo access
        </h2>
        <p className="text-[14px] text-[#666666]">
          The account can now access marketplace actions that require mock
          identity verification.
        </p>
      </div>

      {/* Unlocked actions */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-5 flex flex-col gap-2.5">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#111111]">
          Unlocked demo actions
        </h2>
        <span className="text-[13px] text-[#065F46]">✓ Create auction</span>
        <span className="text-[13px] text-[#065F46]">
          ✓ Place high-value bids
        </span>
        <span className="text-[13px] text-[#065F46]">✓ Withdraw funds</span>
        <span className="text-[13px] text-[#065F46]">✓ Open dispute</span>
      </div>

      {/* Verification record */}
      <div className="rounded-lg bg-[#F9FAFB] border border-[#CBCCC9] p-4 flex flex-col gap-2">
        <h3 className="font-jetbrains text-[16px] font-bold text-[#111111]">
          Verification record
        </h3>
        <p className="text-[13px] text-[#666666]">
          Approved from mock package: personal info, CCCD front/back,
          selfie/liveness, consent.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onContinue}
          className="inline-flex items-center rounded-md bg-[#FF8400] px-4.5 py-3 text-[14px] font-bold text-[#111111] hover:bg-[#e07600] transition-colors"
        >
          Continue to dashboard
        </button>
      </div>
    </div>
  );
}
