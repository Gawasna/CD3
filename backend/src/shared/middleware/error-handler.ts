import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

/**
 * Global error handler — phải đặt CUỐI middleware chain trong app.ts.
 * Không leak stack trace ra production.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Structured log — pino đã gắn req.log từ pino-http
  if (req.log) {
    req.log.error(err);
  } else {
    console.error(err);
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Lỗi không xác định — che thông tin nội bộ trong production
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
      ...(isDev && err instanceof Error ? { detail: err.message, stack: err.stack } : {}),
    },
  });
}
