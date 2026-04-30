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

    // Ghi đè request part bằng dữ liệu đã được parse/transform
    (req as unknown as Record<string, unknown>)[part] = result.data;
    next();
  };
}
