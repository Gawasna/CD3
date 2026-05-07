'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useAuthStore } from '../store/auth.store';
import { fetchNonce, verifySignature, fetchMe } from '../services/api/auth';
import { ganacheLocal } from '../config/wagmi';

const EXPECTED_CHAIN_ID = ganacheLocal.id;

/**
 * Hook quản lý toàn bộ SIWE authentication flow:
 * connect → nonce → sign → verify → store token
 */
export function useWalletAuth() {
  const { address, isConnected, isConnecting, isReconnecting, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const { token, user, status, error, setAuthenticated, setStatus, clearAuth, _hasHydrated } = useAuthStore();

  const isAuthenticated = !!token;
  const isSigning = status === 'signing';
  const isWrongChain = isConnected && chainId !== EXPECTED_CHAIN_ID;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isReady = mounted && _hasHydrated;

  // AUTH-UI-08: khi address thay đổi, clear token cũ và yêu cầu ký lại
  useEffect(() => {
    if (!_hasHydrated) return;
    // Đợi wagmi hydrate xong trạng thái ví
    if (isConnecting || isReconnecting) return;

    // Nếu user đã auth nhưng đổi ví → clear
    if (isAuthenticated && user && address && user.walletAddress.toLowerCase() !== address.toLowerCase()) {
      clearAuth();
    }
  }, [address, isConnecting, isReconnecting, isAuthenticated, user, clearAuth, _hasHydrated]);



  /**
   * Bắt đầu SIWE flow: fetch nonce → build message → sign → verify
   */
  const signIn = useCallback(async () => {
    if (!address) return;
    if (isWrongChain) {
      setStatus('error', 'Please switch to the correct network');
      return;
    }

    setStatus('signing');

    try {
      // 1. Lấy nonce từ backend
      const { nonce, expiresAt } = await fetchNonce(address);

      // 2. Build SIWE-like message (EIP-4361 format tối giản)
      const domain = window.location.host;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();
      const expirationTime = expiresAt;

      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        address,
        '',
        'Sign in to CD3 Auction Platform. This request proves wallet ownership and does not trigger a blockchain transaction or cost gas.',
        '',
        `URI: ${uri}`,
        'Version: 1',
        `Chain ID: ${EXPECTED_CHAIN_ID}`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
        `Expiration Time: ${expirationTime}`,
      ].join('\n');

      // 3. Gọi MetaMask/ví để ký
      const signature = await signMessageAsync({ message });

      // 4. Gửi verify lên backend
      const { token: newToken, user: newUser } = await verifySignature({
        wallet: address,
        message,
        nonce,
        signature,
      });

      // 5. Lưu token + user vào store
      setAuthenticated(newToken, newUser);
    } catch (err: unknown) {
      // User từ chối ký trong MetaMask
      if (err instanceof Error && err.message.includes('User rejected')) {
        setStatus('error', 'You rejected the sign request. Please try again.');
        return;
      }

      const apiErr = err as { code?: string; message?: string };
      setStatus('error', apiErr?.message ?? 'Authentication failed');
    }
  }, [address, isWrongChain, signMessageAsync, setAuthenticated, setStatus]);

  // Tự động trigger SIWE (ký message) ngay khi ví vừa kết nối thành công (tránh user phải bấm thêm nút Sign In)
  useEffect(() => {
    if (!_hasHydrated) return;
    // Không auto trigger nếu đang có token
    if (isConnected && !token && status === 'idle' && address) {
      signIn();
    }
  }, [isConnected, token, status, address, signIn, _hasHydrated]);

  /**
   * Đăng xuất: disconnect ví + clear token
   */
  const signOut = useCallback(() => {
    clearAuth();
    disconnect();
  }, [clearAuth, disconnect]);

  /**
   * AUTH-UI-07: handle 401 từ API → clear session
   */
  const handleApiUnauthorized = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  return {
    isReady,
    address,
    isConnected,
    isAuthenticated,
    isSigning,
    isWrongChain,
    user,
    token,
    error,
    signIn,
    signOut,
    handleApiUnauthorized,
  };
}
