'use client';

import { useState } from 'react';
import { KycStatusBadge } from './KycStatusBadge';

interface KycRejectedProps {
  walletAddress: string;
  rejectionReason?: string;
  onSaveChanges?: () => void;
  onResubmit?: () => void;
}

export function KycRejected({
  walletAddress,
  rejectionReason = 'CCCD back side is unreadable. Replace the back-side image and retake selfie if needed.',
  onSaveChanges,
  onResubmit,
}: KycRejectedProps) {
  const [newBackStatus, setNewBackStatus] = useState<'missing' | 'ready'>(
    'missing',
  );
  const [selfieRetaken, setSelfieRetaken] = useState(false);

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
            <span className="font-mono">{walletAddress}</span> needs changes
            before the mock package can be approved.
          </p>
        </div>
        <KycStatusBadge status="REJECTED" />
      </div>

      {/* Rejection reason */}
      <div className="rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] p-4 flex flex-col gap-2">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#991B1B]">
          Review result: rejected
        </h2>
        <p className="text-[14px] font-semibold text-[#991B1B]">
          Reason: {rejectionReason}
        </p>
      </div>

      {/* Required fixes checklist */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-5 flex flex-col gap-2.5">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#111111]">
          Required fixes
        </h2>
        <span className="text-[13px] text-[#065F46]">
          ✓ Personal information kept from previous submission
        </span>
        <span className="text-[13px] text-[#065F46]">
          ✓ CCCD front accepted
        </span>
        <span className="text-[13px] font-bold text-[#991B1B]">
          ! Replace CCCD back side
        </span>
        <span className="text-[13px] text-[#666666]">
          ○ Confirm selfie/liveness still matches
        </span>
      </div>

      {/* Resubmit card */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-5 flex flex-col gap-3.5">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#111111]">
          Resubmit documents
        </h2>

        <div className="flex gap-3">
          {/* Front side - accepted */}
          <div className="flex-1 rounded-lg border border-[#CBCCC9] bg-[#F9FAFB] p-3.5 flex flex-col gap-2">
            <span className="text-[13px] font-bold text-[#065F46]">
              Front side accepted
            </span>
            <span className="text-[12px] text-[#666666]">
              cccd-front.png — no action needed
            </span>
          </div>

          {/* Back side - needs replacement */}
          <div
            className={`flex-1 rounded-lg p-3.5 flex flex-col gap-2 border ${
              newBackStatus === 'ready'
                ? 'border-[#CBCCC9] bg-[#F9FAFB]'
                : 'border-[#FCA5A5] bg-[#FEF2F2]'
            }`}
          >
            <span
              className={`text-[13px] font-bold ${
                newBackStatus === 'ready'
                  ? 'text-[#065F46]'
                  : 'text-[#991B1B]'
              }`}
            >
              {newBackStatus === 'ready'
                ? 'Back side replaced'
                : 'Back side missing replacement'}
            </span>
            <button
              onClick={() =>
                setNewBackStatus(
                  newBackStatus === 'ready' ? 'missing' : 'ready',
                )
              }
              className={`text-[12px] font-semibold hover:underline text-left ${
                newBackStatus === 'ready'
                  ? 'text-[#666666]'
                  : 'text-[#FF8400]'
              }`}
            >
              {newBackStatus === 'ready' ? 'Remove' : 'Upload new back image'}
            </button>
          </div>
        </div>
      </div>

      {/* Selfie confirmation */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-4 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <h3 className="font-jetbrains text-[16px] font-bold text-[#111111]">
            Selfie check
          </h3>
          <p className="text-[13px] text-[#666666]">
            Retake only if the replacement document changes the visible identity
            details.
          </p>
          {selfieRetaken && (
            <span className="text-[13px] text-[#065F46] font-semibold">
              ✓ Selfie retaken
            </span>
          )}
        </div>
        <button
          onClick={() => setSelfieRetaken(true)}
          disabled={selfieRetaken}
          className="inline-flex items-center rounded-md bg-[#E7E8E5] px-3.5 py-2.5 text-[13px] font-bold text-[#111111] hover:bg-[#CBCCC9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {selfieRetaken ? 'Retaken' : 'Retake selfie'}
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onSaveChanges}
          className="inline-flex items-center rounded-md bg-[#E7E8E5] px-4 py-3 text-[14px] font-bold text-[#111111] hover:bg-[#CBCCC9] transition-colors"
        >
          Save changes
        </button>
        <button
          onClick={onResubmit}
          disabled={newBackStatus === 'missing'}
          className="inline-flex items-center rounded-md bg-[#FF8400] px-4.5 py-3 text-[14px] font-bold text-[#111111] hover:bg-[#e07600] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Resubmit verification
        </button>
      </div>
    </div>
  );
}
