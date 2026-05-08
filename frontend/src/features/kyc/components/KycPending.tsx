'use client';

import { KycStatusBadge } from './KycStatusBadge';

interface KycPendingProps {
  walletAddress: string;
  onRefreshStatus?: () => void;
  onBackToDashboard?: () => void;
}

export function KycPending({
  walletAddress,
  onRefreshStatus,
  onBackToDashboard,
}: KycPendingProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2 flex-1">
          <h1 className="font-jetbrains text-[28px] font-bold text-[#111111]">
            KYC Verification
          </h1>
          <p className="text-sm text-[#666666]">
            Mock application submitted for wallet{' '}
            <span className="font-mono">{walletAddress}</span>.
          </p>
        </div>
        <KycStatusBadge status="PENDING" />
      </div>

      {/* Pending notice */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-4 flex flex-col gap-2">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#111111]">
          Your mock KYC package is under review
        </h2>
        <p className="text-[14px] text-[#666666]">
          The submitted package includes personal information, CCCD front/back
          images, and selfie/liveness mock data.
        </p>
      </div>

      {/* Submitted data */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-5 flex flex-col gap-2.5">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#111111]">
          Submitted data
        </h2>
        <span className="text-[13px] text-[#065F46]">
          ✓ Personal info: Alice Nguyen, Vietnam
        </span>
        <span className="text-[13px] text-[#065F46]">
          ✓ CCCD front: cccd-front.png
        </span>
        <span className="text-[13px] text-[#065F46]">
          ✓ CCCD back: cccd-back.png
        </span>
        <span className="text-[13px] text-[#065F46]">
          ✓ Selfie: selfie-capture.png
        </span>
        <span className="text-[13px] text-[#065F46]">
          ✓ Demo consent accepted
        </span>
      </div>

      {/* Review timeline */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-5 flex flex-col gap-3">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#111111]">
          Review timeline
        </h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[13px] font-bold text-[#065F46]">
              Submitted
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[13px] font-bold text-[#065F46]">
              File checks passed
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
            <span className="text-[13px] font-bold text-[#92400E]">
              ⏳ Manual review
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#CBCCC9]" />
            <span className="text-[13px] text-[#666666]">○ Result</span>
          </div>
        </div>
      </div>



      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onRefreshStatus}
          className="inline-flex items-center rounded-md bg-[#FF8400] px-4 py-3 text-[14px] font-bold text-[#111111] hover:bg-[#e07600] transition-colors"
        >
          Refresh status
        </button>
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center rounded-md bg-[#E7E8E5] px-4 py-3 text-[14px] font-bold text-[#111111] hover:bg-[#CBCCC9] transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
