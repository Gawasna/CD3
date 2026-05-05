'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet, metaMaskWallet, rainbowWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

// Ganache Desktop/CLI runtime chain — chainId 1337, RPC port 7545
// KHÔNG nhầm với Hardhat in-process network (chainId 31337, chỉ dùng cho unit test smart contract)
const ganacheLocal = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 1337),
  name: 'Ganache Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:7545'] },
  },
});

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';
const hasValidProjectId = walletConnectProjectId.length > 0;

// Nếu có projectId hợp lệ thì thêm WalletConnect-based wallets (Rainbow, MetaMask QR, v.v.)
// Nếu không (môi trường local), chỉ dùng injected wallet (MetaMask browser extension via EIP-6963)
// injectedWallet không yêu cầu projectId — tránh SDK WalletConnect khởi tạo với ID rỗng gây treo UI
const walletList = hasValidProjectId
  ? [injectedWallet, metaMaskWallet, rainbowWallet]
  : [injectedWallet];

const connectors = connectorsForWallets(
  [{ groupName: 'Recommended', wallets: walletList }],
  {
    appName: 'CD3 Auction Platform',
    projectId: hasValidProjectId ? walletConnectProjectId : 'local-dev-no-wc',
  },
);

export const wagmiConfig = createConfig({
  chains: [ganacheLocal],
  connectors,
  transports: {
    [ganacheLocal.id]: http(process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:7545'),
  },
  // SSR: true cần thiết cho Next.js App Router để tránh hydration mismatch
  ssr: true,
});

export { ganacheLocal };
export { hasValidProjectId };
