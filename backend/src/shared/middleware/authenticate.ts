import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../utils/api-error';

interface JwtPayload {
  userId: string;
  walletAddress: string;
  role: 'USER' | 'ADMIN';
}

/**
 * JWT authentication middleware.
 * - Đọc Authorization: Bearer <token>
 * - Verify JWT với JWT_SECRET
 * - Load user từ DB để check isActive (AUTH-FR-08)
 * - Gán req.user
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(ApiError.unauthorized('MISSING_TOKEN', 'Authorization header is required'));
    return;
  }

  const token = authHeader.slice(7); // Cắt "Bearer "

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('TOKEN_EXPIRED', 'Token has expired'));
    } else {
      next(ApiError.unauthorized('INVALID_TOKEN', 'Invalid token'));
    }
    return;
  }

  // Load user từ DB để xác nhận vẫn còn active (không dựa vào payload stale)
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, walletAddress: true, role: true, isActive: true },
  });

  if (!user) {
    next(ApiError.unauthorized('INVALID_TOKEN', 'User not found'));
    return;
  }

  if (!user.isActive) {
    next(ApiError.forbidden('USER_INACTIVE', 'Your account has been suspended'));
    return;
  }

  // Attach user vào request để downstream handlers dùng
  req.user = {
    id: user.id,
    walletAddress: user.walletAddress,
    role: user.role as 'USER' | 'ADMIN',
  };

  next();
}
