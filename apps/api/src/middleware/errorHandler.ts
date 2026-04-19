import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  errors?: Record<string, string[]>;
}

const isDev = process.env.NODE_ENV !== 'production';

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Prisma connection / availability errors ─────────────────────────────
  // P1001 – Can't reach database server
  // P1002 – Database server timeout
  // P1003 – Database file not found
  // P1008 – Operations timed out
  // P1009 – Database already exists (shouldn't bubble, but guard anyway)
  // P1010 – User denied access on the database
  // P1017 – Server closed the connection
  if (
    err.code === 'P1001' ||
    err.code === 'P1002' ||
    err.code === 'P1003' ||
    err.code === 'P1008' ||
    err.code === 'P1010' ||
    err.code === 'P1017'
  ) {
    res.status(503).json({
      success: false,
      error: 'Database unavailable. Please try again shortly.',
      code: 'DB_UNAVAILABLE',
      ...(isDev && { detail: err.message }),
    });
    return;
  }

  // ── Database schema not initialised ────────────────────────────────────
  // P2021 – Table or view does not exist in the current database
  // P2010 – Raw query failed (can occur when schema is missing)
  if (err.code === 'P2021' || err.code === 'P2010') {
    console.error('❌ Database schema error – run `pnpm db:push` or `pnpm db:seed`:', err.message);
    res.status(503).json({
      success: false,
      error: isDev
        ? `Database schema not initialized. Run 'pnpm db:push' then 'pnpm db:seed'. Detail: ${err.message}`
        : 'Service temporarily unavailable. Please try again later.',
      code: 'DB_SCHEMA_ERROR',
    });
    return;
  }

  console.error('❌ API Error:', {
    message: err.message,
    code: err.code,
    stack: isDev ? err.stack : undefined,
    statusCode: err.statusCode,
  });

  // ── Prisma data errors ──────────────────────────────────────────────────
  if (err.code === 'P2002') {
    res.status(409).json({
      success: false,
      error: 'A record with this data already exists',
      code: 'DUPLICATE_RECORD',
    });
    return;
  }

  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      error: 'Record not found',
      code: 'NOT_FOUND',
    });
    return;
  }

  if (err.code === 'P2003') {
    res.status(422).json({
      success: false,
      error: 'Related record not found',
      code: 'FOREIGN_KEY_VIOLATION',
    });
    return;
  }

  // ── JWT errors ──────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // ── Validation errors ───────────────────────────────────────────────────
  if (err.errors) {
    res.status(422).json({
      success: false,
      error: 'Validation failed',
      errors: err.errors,
    });
    return;
  }

  // ── Generic fallback ────────────────────────────────────────────────────
  const statusCode = err.statusCode || 500;
  // In development expose the real error message so the cause is visible in
  // the browser console / UI.  In production always return a safe generic
  // message so internal details are never leaked.
  //
  // Guard against plain-object errors (e.g. from Razorpay SDK) where
  // `statusCode` is set but `message` is undefined because the thrown value
  // is not an actual Error instance.
  const rawMessage: string | undefined =
    err.message ||
    (err as any)?.error?.description ||
    undefined;
  const message = err.statusCode
    ? (rawMessage || 'An error occurred')
    : isDev
      ? (rawMessage || 'Internal server error')
      : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isDev && { stack: err.stack }),
  });
}

export function createError(message: string, statusCode = 500, code?: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}
