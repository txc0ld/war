export type AppErrorStatusCode =
  | 400
  | 401
  | 403
  | 404
  | 409
  | 410
  | 429
  | 500
  | 502
  | 503;

export class AppError extends Error {
  constructor(
    public readonly statusCode: AppErrorStatusCode,
    public readonly code: string,
    message: string,
    public readonly expose = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
