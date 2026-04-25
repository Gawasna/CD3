'use client';

import { Loader, CheckCircle } from 'lucide-react';

interface AuthLoadingStateProps {
  step: 'connecting' | 'signing' | 'authenticating';
}

export default function AuthLoadingState({ step }: AuthLoadingStateProps) {
  const steps = [
    { id: 'connecting', label: 'Wallet connected', completed: true },
    { id: 'signing', label: 'Waiting for signature...', completed: step !== 'connecting' },
    { id: 'authenticating', label: 'Authenticating', completed: step === 'authenticating' },
  ];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
      <div className="flex items-center justify-center w-20 h-20 bg-[#E7E8E5] rounded-full">
        <Loader className="w-10 h-10 text-[#FF8400] animate-spin" />
      </div>

      <h2 className="font-jetbrains text-[28px] font-bold text-[#111111]">
        Connecting...
      </h2>

      <p className="font-geist text-base text-[#666666] text-center max-w-[500px] leading-relaxed">
        Please sign the message in your wallet to continue
      </p>

      <div className="flex flex-col gap-3 w-full">
        {steps.map((s, index) => {
          const isActive = s.id === step;
          const isCompleted = s.completed && !isActive;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 w-full h-12 px-3 rounded-2xl transition-colors ${
                isCompleted
                  ? 'bg-[#DFE6E1]'
                  : isActive
                  ? 'bg-[#E7E8E5]'
                  : 'bg-[#E7E8E5]'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-[#004D1A]" />
              ) : isActive ? (
                <Loader className="w-5 h-5 text-[#FF8400] animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#CBCCC9]" />
              )}
              <span
                className={`font-geist text-sm font-medium ${
                  isCompleted
                    ? 'text-[#004D1A]'
                    : isActive
                    ? 'text-[#111111]'
                    : 'text-[#666666]'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
