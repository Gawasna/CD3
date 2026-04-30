'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '../services/api/auth';

const TOKEN_KEY = 'cd3_auth_token';

type AuthStatus = 'idle' | 'signing' | 'authenticated' | 'error';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  status: AuthStatus;
  error: string | null;

  // Setters
  setAuthenticated: (token: string, user: UserProfile) => void;
  setStatus: (status: AuthStatus, error?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      status: 'idle',
      error: null,

      setAuthenticated: (token, user) =>
        set({ token, user, status: 'authenticated', error: null }),

      setStatus: (status, error) => set({ status, error: error ?? null }),

      clearAuth: () => set({ token: null, user: null, status: 'idle', error: null }),
    }),
    {
      name: TOKEN_KEY,
      storage: createJSONStorage(() => localStorage),
      // Chỉ persist token và user — status/error là transient
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
