import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

/**
 * Role-based access control middleware.
 * Phải dùng SAU authenticate middleware.
 * Ví dụ: router.get('/admin/users', authenticate, requireRole('ADMIN'), handler)
 */
export function requireRole(...roles: Array<'USER' | 'ADMIN'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('MISSING_TOKEN', 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden('INSUFFICIENT_ROLE', 'You do not have permission to access this resource'));
      return;
    }

    next();
  };
}
