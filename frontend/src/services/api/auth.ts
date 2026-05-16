const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type UserProfile = {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  kycStatus: string;
  isActive: boolean;
  address1?: string | null;
  address2?: string | null;
  lastAddressUpdate?: string | null;
};

export type NonceResponse = {
  nonce: string;
  expiresAt: string;
};

export type VerifyResponse = {
  token: string;
  user: UserProfile;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

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

// ── Auth API ─────────────────────────────────────────────────────────────────

export async function fetchNonce(wallet: string): Promise<NonceResponse> {
  return apiFetch<NonceResponse>(`/auth/nonce?wallet=${encodeURIComponent(wallet)}`);
}

export async function verifySignature(payload: {
  wallet: string;
  message: string;
  nonce: string;
  signature: string;
}): Promise<VerifyResponse> {
  return apiFetch<VerifyResponse>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMe(token: string): Promise<UserProfile> {
  const data = await apiFetch<{ user: UserProfile }>('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.user;
}

export async function updateMe(
  token: string,
  data: { displayName?: string; avatarUrl?: string },
): Promise<UserProfile> {
  const res = await apiFetch<{ user: UserProfile }>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.user;
}
