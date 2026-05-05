import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/api-error';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Factory middleware — validate một phần của request bằng Zod schema.
 * Trả 400 INVALID_PAYLOAD nếu không hợp lệ.
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const firstError = result.error.errors[0];
      next(ApiError.badRequest('INVALID_PAYLOAD', firstError?.message ?? 'Validation failed'));
      return;
    }

    // Express 5: req.query là một getter (read-only), không thể gán trực tiếp req[part] = result.data.
    // Dùng Object.defineProperty để đè lên getter đó.
    Object.defineProperty(req, part, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    
    next();
  };
}
