import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { verifyMessage } from 'ethers';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/api-error';
import type { NonceQuery, VerifyBody } from './auth.schema';

const NONCE_TTL_MS = env.SIWE_NONCE_TTL_MINUTES * 60 * 1000;

// ── Nonce ──────────────────────────────────────────────────────────────────

export async function generateNonce(input: NonceQuery) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

  await prisma.authNonce.create({
    data: {
      walletAddress: input.wallet,
      nonce,
      expiresAt,
    },
  });

  return { nonce, expiresAt };
}

// ── Verify ─────────────────────────────────────────────────────────────────

export async function verifySignature(input: VerifyBody) {
  // 1. Tìm nonce record — nonce là globally unique (unique constraint)
  const nonceRecord = await prisma.authNonce.findUnique({
    where: { nonce: input.nonce },
  });

  if (!nonceRecord) {
    throw ApiError.unauthorized('INVALID_NONCE', 'Nonce does not exist');
  }

  // 2. Kiểm tra nonce thuộc đúng wallet
  if (nonceRecord.walletAddress !== input.wallet) {
    throw ApiError.unauthorized('INVALID_NONCE', 'Nonce wallet mismatch');
  }

  // 3. Kiểm tra nonce chưa dùng (AUTH-NFR-03)
  if (nonceRecord.usedAt !== null) {
    throw ApiError.unauthorized('INVALID_NONCE', 'Nonce has already been used');
  }

  // 4. Kiểm tra nonce chưa hết hạn
  if (nonceRecord.expiresAt < new Date()) {
    throw ApiError.unauthorized('INVALID_NONCE', 'Nonce has expired');
  }

  // 5. Verify ECDSA signature — ethers.verifyMessage recover địa chỉ từ message + sig
  let recoveredAddress: string;
  try {
    recoveredAddress = verifyMessage(input.message, input.signature);
  } catch {
    throw ApiError.unauthorized('INVALID_SIGNATURE', 'Failed to recover address from signature');
  }

  // 6. So sánh lowercase để tránh case-sensitive mismatch (AUTH-NFR-02)
  if (recoveredAddress.toLowerCase() !== input.wallet.toLowerCase()) {
    throw ApiError.unauthorized('INVALID_SIGNATURE', 'Signature does not match wallet address');
  }

  // 7. Transaction: mark nonce used + upsert user (atomic)
  const user = await prisma.$transaction(async (tx: PrismaClient) => {
    await tx.authNonce.update({
      where: { id: nonceRecord.id },
      data: { usedAt: new Date() },
    });

    return tx.user.upsert({
      where: { walletAddress: input.wallet },
      update: { updatedAt: new Date() },
      create: { walletAddress: input.wallet },
    });
  });

  // 8. Check user active (AUTH-FR-08)
  if (!user.isActive) {
    throw ApiError.forbidden('USER_INACTIVE', 'Your account has been suspended');
  }

  // 9. Sign JWT
  const token = jwt.sign(
    {
      userId: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

  return {
    token,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      kycStatus: user.kycStatus,
      isActive: user.isActive,
    },
  };
}

// ── Cleanup (AUTH-FR-11) ───────────────────────────────────────────────────

/** Xóa nonce hết hạn — gọi từ cron job hoặc startup */
export async function cleanupExpiredNonces(): Promise<number> {
  const result = await prisma.authNonce.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
