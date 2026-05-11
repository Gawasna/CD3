import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('ethers', () => ({
  isAddress: (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr),
  verifyMessage: vi.fn(),
}));

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

const WALLET = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const OTHER_WALLET = '0x0000000000000000000000000000000000000001';
const NONCE = 'abc123def456abc1';

describe('auth.service - generateNonce', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a single-use nonce record with the configured TTL', async () => {
    vi.mocked(prisma.authNonce.create).mockResolvedValue({} as never);

    const result = await generateNonce({ wallet: WALLET });

    expect(prisma.authNonce.create).toHaveBeenCalledOnce();
    expect(prisma.authNonce.create).toHaveBeenCalledWith({
      data: {
        walletAddress: WALLET,
        nonce: result.nonce,
        expiresAt: result.expiresAt,
      },
    });
    expect(result.nonce).toHaveLength(32);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('auth.service - verifySignature', () => {
  const validNonceRecord = {
    id: 'nonce-id',
    walletAddress: WALLET,
    nonce: NONCE,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
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

  it('returns a JWT and upserts the user when the signature is valid', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue(validNonceRecord as never);
    vi.mocked(verifyMessage).mockReturnValue(WALLET);

    const result = await verifySignature(validInput);

    expect(result.token).toBeDefined();
    expect(result.user.walletAddress).toBe(WALLET);
    expect(prisma.authNonce.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ usedAt: expect.any(Date) }) }),
    );
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { walletAddress: WALLET },
      update: { updatedAt: expect.any(Date) },
      create: { walletAddress: WALLET },
    });
  });

  it('rejects when nonce does not exist', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue(null);

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_NONCE',
    });
  });

  it('rejects replayed nonce before signature verification', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue({
      ...validNonceRecord,
      usedAt: new Date(),
    } as never);

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_NONCE',
    });
    expect(verifyMessage).not.toHaveBeenCalled();
  });

  it('rejects nonce issued for a different wallet before signature verification', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue({
      ...validNonceRecord,
      walletAddress: OTHER_WALLET,
    } as never);

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_NONCE',
    });
    expect(verifyMessage).not.toHaveBeenCalled();
  });

  it('rejects expired nonce before signature verification', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue({
      ...validNonceRecord,
      expiresAt: new Date(Date.now() - 1000),
    } as never);

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_NONCE',
    });
    expect(verifyMessage).not.toHaveBeenCalled();
  });

  it('rejects malformed signatures without consuming the nonce', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue(validNonceRecord as never);
    vi.mocked(verifyMessage).mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_SIGNATURE',
    });
    expect(prisma.authNonce.update).not.toHaveBeenCalled();
    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });

  it('rejects signatures recovered from a different wallet', async () => {
    vi.mocked(prisma.authNonce.findUnique).mockResolvedValue(validNonceRecord as never);
    vi.mocked(verifyMessage).mockReturnValue(OTHER_WALLET);

    await expect(verifySignature(validInput)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_SIGNATURE',
    });
  });

  it('rejects suspended users', async () => {
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
  it('deletes expired nonces and returns the deleted count', async () => {
    vi.mocked(prisma.authNonce.deleteMany).mockResolvedValue({ count: 5 });

    const count = await cleanupExpiredNonces();

    expect(count).toBe(5);
    expect(prisma.authNonce.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
  });
});
