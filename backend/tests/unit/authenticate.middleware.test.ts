import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../src/config/database', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock('../../src/config/env', () => ({
  env: { JWT_SECRET: 'test-secret-for-unit-tests-only' },
}));

import jwt from 'jsonwebtoken';
import { prisma } from '../../src/config/database';
import { authenticate } from '../../src/shared/middleware/authenticate';

const JWT_SECRET = 'test-secret-for-unit-tests-only';

function makeReq(headers: Record<string, string> = {}): Partial<Request> {
  return { headers } as Partial<Request>;
}

const mockRes = {} as Response;
const mockNext = vi.fn() as NextFunction;

const VALID_USER = {
  id: 'user-id',
  walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  role: 'USER',
  isActive: true,
};

describe('authenticate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(VALID_USER as never);
  });

  it('thiếu header Authorization → 401 MISSING_TOKEN', async () => {
    await authenticate(makeReq() as Request, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, code: 'MISSING_TOKEN' }),
    );
  });

  it('header không bắt đầu bằng Bearer → 401 MISSING_TOKEN', async () => {
    await authenticate(
      makeReq({ authorization: 'Basic dXNlcjpwYXNz' }) as Request,
      mockRes,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, code: 'MISSING_TOKEN' }),
    );
  });

  it('token không hợp lệ → 401 INVALID_TOKEN', async () => {
    await authenticate(
      makeReq({ authorization: 'Bearer invalid.token.here' }) as Request,
      mockRes,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, code: 'INVALID_TOKEN' }),
    );
  });

  it('token hết hạn → 401 TOKEN_EXPIRED', async () => {
    // Tạo token hết hạn 1 giây trước
    const expiredToken = jwt.sign(
      { userId: 'user-id', walletAddress: '0x...', role: 'USER' },
      JWT_SECRET,
      { expiresIn: -1 },
    );

    await authenticate(
      makeReq({ authorization: `Bearer ${expiredToken}` }) as Request,
      mockRes,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, code: 'TOKEN_EXPIRED' }),
    );
  });

  it('valid token + user active → req.user được gán, next() không lỗi', async () => {
    const token = jwt.sign(
      { userId: 'user-id', walletAddress: VALID_USER.walletAddress, role: 'USER' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const req = makeReq({ authorization: `Bearer ${token}` }) as Request;
    await authenticate(req, mockRes, mockNext);

    expect(req.user).toMatchObject({ id: 'user-id', role: 'USER' });
    expect(mockNext).toHaveBeenCalledWith(); // không có argument = success
  });

  it('user không tồn tại trong DB → 401 INVALID_TOKEN', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const token = jwt.sign(
      { userId: 'ghost-id', walletAddress: '0x...', role: 'USER' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    await authenticate(
      makeReq({ authorization: `Bearer ${token}` }) as Request,
      mockRes,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, code: 'INVALID_TOKEN' }),
    );
  });

  it('user bị suspend → 403 USER_INACTIVE', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...VALID_USER, isActive: false } as never);
    const token = jwt.sign(
      { userId: 'user-id', walletAddress: VALID_USER.walletAddress, role: 'USER' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    await authenticate(
      makeReq({ authorization: `Bearer ${token}` }) as Request,
      mockRes,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ status: 403, code: 'USER_INACTIVE' }),
    );
  });
});
