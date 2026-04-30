'use client';

import { useAuthStore } from '../../store/auth.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/**
 * Authenticated fetch — tự gắn Authorization: Bearer header.
 * AUTH-UI-05: tất cả protected API call đều qua hàm này.
 * AUTH-UI-07: nếu nhận 401, clear token và throw để caller hiển thị lỗi.
 */
export async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  // AUTH-UI-07: token hết hạn hoặc bị revoke → clear session
  if (res.status === 401) {
    useAuthStore.getState().clearAuth();
    throw new Error('SESSION_EXPIRED');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error?.message ?? `HTTP ${res.status}`) as Error & {
      status: number;
      code: string;
    };
    err.status = res.status;
    err.code = body?.error?.code ?? 'UNKNOWN';
    throw err;
  }

  return res.json() as Promise<T>;
}
