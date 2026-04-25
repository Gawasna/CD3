'use client';

import { Wallet, Shield, Zap, Clock } from 'lucide-react';
import ConnectWalletButton from '@/components/auth/ConnectWalletButton';

export default function LoginPage() {
  const handleConnect = () => {
    // TODO: Implement wallet connection logic
    console.log('Connect wallet clicked');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] bg-[#F2F3F0] p-8">
      <div className="flex flex-col items-center gap-8 w-full max-w-[600px]">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center justify-center w-16 h-16 bg-[#FF8400] rounded-full">
            <Wallet className="w-8 h-8 text-[#111111]" />
          </div>

          <h1 className="font-jetbrains text-[32px] font-bold text-[#111111] text-center">
            Connect Your Wallet
          </h1>

          <p className="font-geist text-base text-[#666666] text-center max-w-[600px] leading-relaxed">
            Sign in with Ethereum to access the CD3 auction platform. No gas fees required.
          </p>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-4 w-full max-w-[400px]">
          <ConnectWalletButton onClick={handleConnect} />

          <p className="font-geist text-sm text-[#666666] text-center">
            Supports MetaMask, WalletConnect, Coinbase Wallet and more
          </p>
        </div>

        {/* Features Section */}
        <div className="flex items-center justify-center gap-6 w-full max-w-[800px] mt-8">
          <div className="flex flex-col items-center gap-3 flex-1">
            <Shield className="w-8 h-8 text-[#FF8400]" />
            <h3 className="font-jetbrains text-base font-semibold text-[#111111] text-center">
              Secure
            </h3>
            <p className="font-geist text-sm text-[#666666] text-center">
              EIP-4361 standard authentication
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 flex-1">
            <Zap className="w-8 h-8 text-[#FF8400]" />
            <h3 className="font-jetbrains text-base font-semibold text-[#111111] text-center">
              No Gas Fees
            </h3>
            <p className="font-geist text-sm text-[#666666] text-center">
              Signing doesn&apos;t cost anything
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 flex-1">
            <Clock className="w-8 h-8 text-[#FF8400]" />
            <h3 className="font-jetbrains text-base font-semibold text-[#111111] text-center">
              One-Click
            </h3>
            <p className="font-geist text-sm text-[#666666] text-center">
              Quick and seamless experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
