'use client';

import { useState } from 'react';
import AuthLoadingState from '@/components/auth/AuthLoadingState';
import AuthErrorState, { AuthErrorType } from '@/components/auth/AuthErrorState';
import { useToast } from '@/components/auth/ToastContainer';
import { ToastType } from '@/components/auth/Toast';

type DemoState = 'idle' | 'loading' | 'error';
type LoadingStep = 'connecting' | 'signing' | 'authenticating';

export default function AuthDemoPage() {
  const [state, setState] = useState<DemoState>('idle');
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('connecting');
  const [errorType, setErrorType] = useState<AuthErrorType>('rejected');
  const { showToast } = useToast();

  const handleShowToast = (type: ToastType, message: string) => {
    showToast(type, message);
  };

  return (
    <div className="flex flex-col gap-8 p-8 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      <div className="flex flex-col gap-4">
        <h1 className="font-jetbrains text-3xl font-bold text-[#111111]">
          Authentication States Demo
        </h1>
        <p className="font-geist text-base text-[#666666]">
          Preview all authentication UI states and components
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 p-6 bg-white border border-[#CBCCC9] rounded-2xl">
        <h2 className="font-jetbrains text-xl font-bold text-[#111111]">Controls</h2>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setState('idle')}
            className="px-4 py-2 bg-[#E7E8E5] rounded-lg font-jetbrains text-sm font-medium hover:bg-[#d8d9d6]"
          >
            Reset to Idle
          </button>
          <button
            onClick={() => setState('loading')}
            className="px-4 py-2 bg-[#FF8400] rounded-lg font-jetbrains text-sm font-medium text-[#111111] hover:opacity-90"
          >
            Show Loading
          </button>
          <button
            onClick={() => setState('error')}
            className="px-4 py-2 bg-[#E9E3D8] rounded-lg font-jetbrains text-sm font-medium text-[#804200] hover:opacity-90"
          >
            Show Error
          </button>
        </div>

        {state === 'loading' && (
          <div className="flex gap-3">
            <button
              onClick={() => setLoadingStep('connecting')}
              className="px-4 py-2 bg-[#E7E8E5] rounded-lg font-geist text-sm hover:bg-[#d8d9d6]"
            >
              Step: Connecting
            </button>
            <button
              onClick={() => setLoadingStep('signing')}
              className="px-4 py-2 bg-[#E7E8E5] rounded-lg font-geist text-sm hover:bg-[#d8d9d6]"
            >
              Step: Signing
            </button>
            <button
              onClick={() => setLoadingStep('authenticating')}
              className="px-4 py-2 bg-[#E7E8E5] rounded-lg font-geist text-sm hover:bg-[#d8d9d6]"
            >
              Step: Authenticating
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="flex gap-3">
            <button
              onClick={() => setErrorType('rejected')}
              className="px-4 py-2 bg-[#E7E8E5] rounded-lg font-geist text-sm hover:bg-[#d8d9d6]"
            >
              Error: Rejected
            </button>
            <button
              onClick={() => setErrorType('wrong-network')}
              className="px-4 py-2 bg-[#E7E8E5] rounded-lg font-geist text-sm hover:bg-[#d8d9d6]"
            >
              Error: Wrong Network
            </button>
            <button
              onClick={() => setErrorType('network-error')}
              className="px-4 py-2 bg-[#E7E8E5] rounded-lg font-geist text-sm hover:bg-[#d8d9d6]"
            >
              Error: Network Error
            </button>
          </div>
        )}
      </div>

      {/* Toast Controls */}
      <div className="flex flex-col gap-4 p-6 bg-white border border-[#CBCCC9] rounded-2xl">
        <h2 className="font-jetbrains text-xl font-bold text-[#111111]">Toast Notifications</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleShowToast('success', 'Login successful! Welcome back.')}
            className="px-4 py-2 bg-[#DFE6E1] rounded-lg font-geist text-sm text-[#004D1A] hover:opacity-90"
          >
            Success Toast
          </button>
          <button
            onClick={() => handleShowToast('warning', 'You cancelled the authentication request.')}
            className="px-4 py-2 bg-[#E9E3D8] rounded-lg font-geist text-sm text-[#804200] hover:opacity-90"
          >
            Warning Toast
          </button>
          <button
            onClick={() => handleShowToast('network', 'Please switch to Sepolia Testnet.')}
            className="px-4 py-2 bg-[#E9E3D8] rounded-lg font-geist text-sm text-[#804200] hover:opacity-90"
          >
            Network Toast
          </button>
          <button
            onClick={() => handleShowToast('error', 'System error. Unable to authenticate.')}
            className="px-4 py-2 bg-[#E9E3D8] rounded-lg font-geist text-sm text-[#804200] hover:opacity-90"
          >
            Error Toast
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex flex-col items-center justify-center gap-8 p-12 bg-white border border-[#CBCCC9] rounded-2xl min-h-[500px]">
        {state === 'idle' && (
          <p className="font-geist text-lg text-[#666666]">
            Select a state from the controls above
          </p>
        )}

        {state === 'loading' && <AuthLoadingState step={loadingStep} />}

        {state === 'error' && (
          <AuthErrorState
            type={errorType}
            onRetry={() => console.log('Retry clicked')}
            onCancel={() => console.log('Cancel clicked')}
          />
        )}
      </div>
    </div>
  );
}
