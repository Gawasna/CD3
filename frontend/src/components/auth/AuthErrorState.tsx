'use client';

import { X, RefreshCw, Network, WifiOff, AlertTriangle } from 'lucide-react';

export type AuthErrorType = 'rejected' | 'wrong-network' | 'network-error';

interface AuthErrorStateProps {
  type: AuthErrorType;
  onRetry: () => void;
  onCancel?: () => void;
  currentNetwork?: string;
  requiredNetwork?: string;
}

export default function AuthErrorState({
  type,
  onRetry,
  onCancel,
  currentNetwork = 'Ethereum Mainnet',
  requiredNetwork = 'Sepolia Testnet',
}: AuthErrorStateProps) {
  const config = {
    rejected: {
      icon: X,
      title: 'Signature Rejected',
      description: 'You cancelled the authentication request. Please try again to access the platform.',
      showCancel: true,
      retryText: 'Try Again',
    },
    'wrong-network': {
      icon: Network,
      title: 'Wrong Network',
      description: 'Please switch to Sepolia Testnet to continue using the platform.',
      showCancel: false,
      retryText: 'Switch Network',
    },
    'network-error': {
      icon: WifiOff,
      title: 'Connection Error',
      description: 'Unable to connect to the network. Please check your internet connection and try again.',
      showCancel: false,
      retryText: 'Retry',
    },
  };

  const { icon: Icon, title, description, showCancel, retryText } = config[type];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
      <div className="flex items-center justify-center w-20 h-20 bg-[#E9E3D8] rounded-full">
        <Icon className="w-10 h-10 text-[#804200]" />
      </div>

      <h2 className="font-jetbrains text-[28px] font-bold text-[#111111]">
        {title}
      </h2>

      <p className="font-geist text-base text-[#666666] text-center max-w-[500px] leading-relaxed">
        {description}
      </p>

      {type === 'wrong-network' && (
        <div className="flex flex-col gap-4 w-full p-6 bg-white border border-[#CBCCC9] rounded-2xl">
          <div className="flex items-center justify-between w-full">
            <span className="font-geist text-sm text-[#666666]">Current Network:</span>
            <span className="font-jetbrains text-sm font-semibold text-[#111111]">
              {currentNetwork}
            </span>
          </div>
          <div className="flex items-center justify-between w-full">
            <span className="font-geist text-sm text-[#666666]">Required Network:</span>
            <span className="font-jetbrains text-sm font-semibold text-[#804200]">
              {requiredNetwork}
            </span>
          </div>
        </div>
      )}

      {type === 'network-error' && (
        <div className="flex flex-col gap-3 w-full p-6 bg-white border border-[#CBCCC9] rounded-2xl">
          <h3 className="font-jetbrains text-base font-semibold text-[#111111]">
            Troubleshooting Tips:
          </h3>
          <ul className="flex flex-col gap-2">
            {[
              'Check your internet connection',
              'Ensure your wallet extension is enabled',
              'Try refreshing the page',
            ].map((tip, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-[#FF8400] rounded-full flex-shrink-0" />
                <span className="font-geist text-sm text-[#666666]">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 h-12 px-6 bg-[#FF8400] rounded-full text-[#111111] font-jetbrains text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-5 h-5" />
          <span>{retryText}</span>
        </button>

        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center justify-center h-12 px-6 bg-[#E7E8E5] rounded-full text-[#111111] font-jetbrains text-sm font-semibold hover:bg-[#d8d9d6] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 w-full p-4 bg-[#E9E3D8] border border-[#804200] rounded-2xl">
        <AlertTriangle className="w-5 h-5 text-[#804200] flex-shrink-0" />
        <p className="font-geist text-sm font-medium text-[#804200]">
          {type === 'rejected' && 'Authentication cancelled. Please try again.'}
          {type === 'wrong-network' && 'Please switch to Sepolia Testnet to continue.'}
          {type === 'network-error' && 'Connection failed. Check your network.'}
        </p>
      </div>
    </div>
  );
}
