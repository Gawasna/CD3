'use client';

import { useState } from 'react';
import { IdCard, Camera } from 'lucide-react';
import { KycStatusBadge } from './KycStatusBadge';

// Mock default form values từ design
const DEFAULT_PERSONAL_INFO = {
  fullName: 'Alice Nguyen',
  dateOfBirth: '1998-01-15',
  idNumber: '012345678901',
  country: 'Vietnam',
};

interface KycNoneProps {
  walletAddress: string;
  onSubmit: () => void;
}

type Step = 1 | 2 | 3 | 4;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: '1 Personal info' },
  { id: 2, label: '2 ID card' },
  { id: 3, label: '3 Selfie' },
  { id: 4, label: '4 Review' },
];

export function KycNone({ walletAddress, onSubmit }: KycNoneProps) {
  const [currentStep] = useState<Step>(1);
  const [personalInfo, setPersonalInfo] = useState(DEFAULT_PERSONAL_INFO);
  const [frontStatus, setFrontStatus] = useState<'ready' | 'missing'>('ready');
  const [backStatus, setBackStatus] = useState<'ready' | 'missing'>('missing');
  const [selfieReady, setSelfieReady] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const handlePersonalChange = (field: keyof typeof DEFAULT_PERSONAL_INFO) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPersonalInfo((prev) => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2 flex-1">
          <h1 className="font-jetbrains text-[28px] font-bold text-[#111111]">
            KYC Verification
          </h1>
          <p className="text-sm text-[#666666]">
            Complete the mock identity check linked to wallet{' '}
            <span className="font-mono">{walletAddress}</span>.
          </p>
        </div>
        <KycStatusBadge status="NONE" />
      </div>

      {/* Demo warning */}
      <div className="rounded-lg bg-[#FEF3C7] border border-[#F59E0B] p-4">
        <p className="text-[14px] font-semibold text-[#92400E]">
          Demo only. Do not upload real identity documents. Use sample CCCD
          images and a mock selfie.
        </p>
      </div>

      {/* Step progress */}
      <div className="flex gap-2.5">
        {STEPS.map((step) => (
          <span
            key={step.id}
            className={`inline-flex items-center rounded-full px-3 py-2 text-[13px] font-bold ${
              step.id === currentStep
                ? 'bg-[#FF8400] text-[#111111]'
                : 'bg-[#E7E8E5] text-[#111111]'
            }`}
          >
            {step.label}
          </span>
        ))}
      </div>

      {/* Personal information card */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-5 flex flex-col gap-3.5">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#111111]">
          Personal information
        </h2>
        <p className="text-[13px] text-[#666666]">
          Basic information used only for the mock KYC submission.
        </p>

        {/* Row 1: Full name + Date of birth */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[12px] font-bold text-[#111111]">
              Full name
            </label>
            <input
              type="text"
              value={personalInfo.fullName}
              onChange={handlePersonalChange('fullName')}
              className="h-10 rounded-md border border-[#CBCCC9] bg-[#F2F3F0] px-3 text-[13px] text-[#666666] outline-none focus:border-[#FF8400] focus:ring-1 focus:ring-[#FF8400] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[12px] font-bold text-[#111111]">
              Date of birth
            </label>
            <input
              type="text"
              value={personalInfo.dateOfBirth}
              onChange={handlePersonalChange('dateOfBirth')}
              className="h-10 rounded-md border border-[#CBCCC9] bg-[#F2F3F0] px-3 text-[13px] text-[#666666] outline-none focus:border-[#FF8400] focus:ring-1 focus:ring-[#FF8400] transition-colors"
            />
          </div>
        </div>

        {/* Row 2: ID number + Country */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[12px] font-bold text-[#111111]">
              CCCD / CMND number
            </label>
            <input
              type="text"
              value={personalInfo.idNumber}
              onChange={handlePersonalChange('idNumber')}
              className="h-10 rounded-md border border-[#CBCCC9] bg-[#F2F3F0] px-3 text-[13px] text-[#666666] outline-none focus:border-[#FF8400] focus:ring-1 focus:ring-[#FF8400] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[12px] font-bold text-[#111111]">
              Country / region
            </label>
            <input
              type="text"
              value={personalInfo.country}
              onChange={handlePersonalChange('country')}
              className="h-10 rounded-md border border-[#CBCCC9] bg-[#F2F3F0] px-3 text-[13px] text-[#666666] outline-none focus:border-[#FF8400] focus:ring-1 focus:ring-[#FF8400] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ID card upload card */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-5 flex flex-col gap-3.5">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#111111]">
          CCCD / CMND upload
        </h2>
        <p className="text-[13px] text-[#666666]">
          Two separate upload slots make the required front and back side
          explicit.
        </p>

        {/* Upload row */}
        <div className="flex gap-3">
          {/* Front side */}
          <div className="flex-1 rounded-lg border border-[#CBCCC9] bg-[#F2F3F0] p-4 flex flex-col gap-2.5">
            <IdCard className="text-[#FF8400]" size={24} />
            <span className="text-[14px] font-bold text-[#111111]">
              Front side
            </span>
            <span className="text-[12px] text-[#666666]">
              Upload mock CCCD front image. JPG, PNG or PDF up to 5MB.
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1.5 text-[12px] font-bold ${
                  frontStatus === 'ready'
                    ? 'bg-[#ECFDF5] text-[#065F46]'
                    : 'bg-[#FEF3C7] text-[#92400E]'
                }`}
              >
                {frontStatus === 'ready' ? 'Ready: cccd-front.png' : 'Missing'}
              </span>
              <button
                onClick={() =>
                  setFrontStatus(
                    frontStatus === 'ready' ? 'missing' : 'ready',
                  )
                }
                className="text-[12px] text-[#FF8400] font-semibold hover:underline"
              >
                {frontStatus === 'ready' ? 'Remove' : 'Upload'}
              </button>
            </div>
          </div>

          {/* Back side */}
          <div className="flex-1 rounded-lg border border-[#CBCCC9] bg-[#F2F3F0] p-4 flex flex-col gap-2.5">
            <IdCard className="text-[#FF8400]" size={24} />
            <span className="text-[14px] font-bold text-[#111111]">
              Back side
            </span>
            <span className="text-[12px] text-[#666666]">
              Upload mock CCCD back image. Required before review.
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1.5 text-[12px] font-bold ${
                  backStatus === 'ready'
                    ? 'bg-[#ECFDF5] text-[#065F46]'
                    : 'bg-[#FEF3C7] text-[#92400E]'
                }`}
              >
                {backStatus === 'ready' ? 'Ready: cccd-back.png' : 'Missing'}
              </span>
              <button
                onClick={() =>
                  setBackStatus(backStatus === 'ready' ? 'missing' : 'ready')
                }
                className="text-[12px] text-[#FF8400] font-semibold hover:underline"
              >
                {backStatus === 'ready' ? 'Remove' : 'Upload'}
              </button>
            </div>
          </div>
        </div>

        {/* Document quality checklist */}
        <div className="rounded-lg bg-[#F9FAFB] p-3 flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-[#111111]">
            Quality checklist
          </span>
          <span className="text-[12px] text-[#065F46]">
            ✓ All four corners visible
          </span>
          <span className="text-[12px] text-[#065F46]">
            ✓ Text is readable
          </span>
          <span className="text-[12px] text-[#666666]">
            ○ No glare or covered information
          </span>
        </div>
      </div>

      {/* Selfie capture card */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-5 flex flex-col gap-3.5">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#111111]">
          Selfie / liveness mock
        </h2>
        <p className="text-[13px] text-[#666666]">
          User can open camera, capture a selfie, retake it, or upload a mock
          selfie if camera permission is blocked.
        </p>

        <div className="flex gap-3">
          {/* Camera preview */}
          <div className="flex-1 rounded-lg bg-[#111111] p-4 flex flex-col items-center justify-center gap-2.5 h-40">
            <Camera className="text-white" size={28} />
            <span className="text-[13px] font-bold text-white">
              Camera preview
            </span>
            <span className="text-[12px] text-[#D1D5DB]">
              {selfieReady ? 'Selfie captured' : 'Capture selfie'}
            </span>
            {!selfieReady && (
              <button
                onClick={() => setSelfieReady(true)}
                className="mt-1 rounded px-3 py-1.5 bg-[#FF8400] text-[#111111] text-[12px] font-bold"
              >
                Capture
              </button>
            )}
          </div>

          {/* Liveness checklist */}
          <div className="flex-1 rounded-lg border border-[#CBCCC9] bg-[#F2F3F0] p-4 flex flex-col gap-2">
            <span className="text-[14px] font-bold text-[#111111]">
              Mock liveness checks
            </span>
            <span className="text-[12px] text-[#065F46]">✓ Face visible</span>
            <span className="text-[12px] text-[#065F46]">
              ✓ Good lighting
            </span>
            <span className="text-[12px] text-[#666666]">
              ○ No mask or sunglasses
            </span>
            <button
              onClick={() => setSelfieReady(true)}
              className="text-[12px] text-[#FF8400] font-bold text-left hover:underline"
            >
              Fallback: upload mock selfie
            </button>
          </div>
        </div>
      </div>

      {/* Review checklist card */}
      <div className="rounded-lg bg-white border border-[#CBCCC9] p-5 flex flex-col gap-2.5">
        <h2 className="font-jetbrains text-[18px] font-bold text-[#111111]">
          Review before submit
        </h2>
        <span className="text-[13px] text-[#065F46]">
          ✓ Personal information completed
        </span>
        <span className="text-[13px] text-[#065F46]">
          ✓ CCCD front uploaded
        </span>
        <span
          className={`text-[13px] ${
            backStatus === 'ready' ? 'text-[#065F46]' : 'text-[#92400E]'
          }`}
        >
          {backStatus === 'ready' ? '✓' : '○'} CCCD back required
        </span>
        <span
          className={`text-[13px] ${
            selfieReady ? 'text-[#065F46]' : 'text-[#666666]'
          }`}
        >
          {selfieReady ? '✓' : '○'} Selfie captured or uploaded
        </span>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            id="consent"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
            className="accent-[#FF8400]"
          />
          <label
            htmlFor="consent"
            className={`text-[13px] cursor-pointer ${
              consentAccepted ? 'text-[#065F46]' : 'text-[#666666]'
            }`}
          >
            {consentAccepted ? '✓' : '○'} Demo consent accepted
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button className="inline-flex items-center rounded-md bg-[#E7E8E5] px-4 py-3 text-[14px] font-bold text-[#111111] hover:bg-[#CBCCC9] transition-colors">
          Save draft
        </button>
        <button
          onClick={onSubmit}
          disabled={!consentAccepted || backStatus === 'missing'}
          className="inline-flex items-center rounded-md bg-[#FF8400] px-4.5 py-3 text-[14px] font-bold text-[#111111] hover:bg-[#e07600] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit for review
        </button>
      </div>
    </div>
  );
}
