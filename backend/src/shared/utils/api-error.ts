/**
 * Structured error class — mang theo HTTP status + machine-readable code.
 * Controller/service throw ApiError, error-handler middleware catch và serialize.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    // Preserve prototype chain khi transpile sang ES5
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // --- Factory helpers ---

  static badRequest(code: string, message: string): ApiError {
    return new ApiError(400, code, message);
  }

  static unauthorized(code: string, message: string): ApiError {
    return new ApiError(401, code, message);
  }

  static forbidden(code: string, message: string): ApiError {
    return new ApiError(403, code, message);
  }

  static notFound(code: string, message: string): ApiError {
    return new ApiError(404, code, message);
  }

  static tooManyRequests(code: string, message: string): ApiError {
    return new ApiError(429, code, message);
  }

  static internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
