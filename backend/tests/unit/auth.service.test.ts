import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma trước khi import service
vi.mock('../../src/config/database', () => ({
  prisma: {
    authNonce: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock ethers.verifyMessage
vi.mock('ethers', () => ({
  isAddress: (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr),
  verifyMessage: vi.fn(),
}));

// Mock env
vi.mock('../../src/config/env', () => ({
  env: {
    SIWE_NONCE_TTL_MINUTES: 10,
    JWT_SECRET: 'test-secret-for-unit-tests-only',
    JWT_EXPIRES_IN: '24h',
  },
}));

import { prisma } from '../../src/config/database';
import { verifyMessage } from 'ethers';
import { generateNonce, verifySignature, cleanupExpiredNonces } from '../../src/modules/auth/auth.service';
import { ApiError } from '../../src/shared/utils/api-error';

const WALLET = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const NONCE = 'abc123def456abc1';

describe('auth.service - generateNonce', () => {
  beforeEach(() => vi.clearAllMocks());

  it('tạo nonce và lưu vào DB với TTL đúng', async () => {
    vi.mocked(prisma.authNonce.create).mockResolvedValue({} as never);

    const result = await generateNonce({ wallet: WALLET });

    expect(prisma.authNonce.create).toHaveBeenCalledOnce();
    expect(result.nonce).toHaveLength(32); // 16 bytes hex = 32 chars
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('auth.service - verifySignature', () => {
  const validNonceRecord = {
    id: 'nonce-id',
    walletAddress: WALLET,
    nonce: NONCE,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 phút nữa
    usedAt: null,
    createdAt: new Date(),
  };

  const validUser = {
    id: 'user-id',
    walletAddress: WALLET,
    displayName: null,
    avatarUrl: null,
    role: 'USER' as const,
    kycStatus: 'NONE' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    kycApprovedAt: null,
    kycApprovedBy: null,
    deletedAt: null,
  };

  const validInput = {
    wallet: WALLET,
    message: 'CD3 sign in message',
    nonce: NONCE,
    signature: '0xdeadbeef',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => fn(prisma as never));
    vi.mocked(prisma.authNonce.update).mockResolvedValue({} as never);
    vi.mocked(prisma.user.upsert).mockResolvedValue(validUser as never);
  });

  it('happy path: signature đúng → trả token + user', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue(validNonceRecord as never);
    vi.mocked(verifyMessage).mockReturnValue(WALLET);

    const result = await verifySignature(validInput);

    expect(result.token).toBeDefined();
    expect(result.user.walletAddress).toBe(WALLET);
    expect(prisma.authNonce.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ usedAt: expect.any(Date) }) }),
    );
  });

  it('nonce không tồn tại → 401 INVALID_NONCE', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue(null);

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_NONCE',
    });
  });

  it('nonce đã dùng (replay attack) → 401 INVALID_NONCE', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue({
      ...validNonceRecord,
      usedAt: new Date(),
    } as never);

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_NONCE',
    });
  });

  it('nonce hết hạn → 401 INVALID_NONCE', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue({
      ...validNonceRecord,
      expiresAt: new Date(Date.now() - 1000), // đã qua 1 giây
    } as never);

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_NONCE',
    });
  });

  it('signature không khớp wallet → 401 INVALID_SIGNATURE', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue(validNonceRecord as never);
    vi.mocked(verifyMessage).mockReturnValue('0xother000000000000000000000000000000000000');

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_SIGNATURE',
    });
  });

  it('user bị suspend → 403 USER_INACTIVE', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue(validNonceRecord as never);
    vi.mocked(verifyMessage).mockReturnValue(WALLET);
    vi.mocked(prisma.user.upsert).mockResolvedValue({ ...validUser, isActive: false } as never);

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 403,
      code: 'USER_INACTIVE',
    });
  });
});

describe('auth.service - cleanupExpiredNonces', () => {
  it('xóa nonce hết hạn và trả số lượng', async () => {
    vi.mocked(prisma.authNonce.deleteMany).mockResolvedValue({ count: 5 });

    const count = await cleanupExpiredNonces();

    expect(count).toBe(5);
    expect(prisma.authNonce.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
  });
});
