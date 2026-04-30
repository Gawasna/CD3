'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Ganache local chain — chainId 1337 (hoặc 31337 nếu dùng Hardhat)
const ganacheLocal = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 1337),
  name: 'Ganache Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:7545'] },
  },
});

export const wagmiConfig = getDefaultConfig({
  appName: 'CD3 Auction Platform',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'PLACEHOLDER',
  chains: [ganacheLocal],
  ssr: true,
});

export { ganacheLocal };
