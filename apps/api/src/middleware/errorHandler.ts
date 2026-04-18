import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  errors?: Record<string, string[]>;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Prisma client / database connection errors — checked first so they return
  // 503 before falling through to the generic 500 handler.
  if (err.code === 'P1001' || err.code === 'P1003' || err.code === 'P1008' || err.code === 'P1017') {
    res.status(503).json({
      success: false,
      error: 'Database unavailable. Please try again shortly.',
      code: 'DB_UNAVAILABLE',
    });
    return;
  }

  console.error('❌ API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    statusCode: err.statusCode,
  });

  // Prisma errors
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

  // JWT errors
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

  // Validation errors
  if (err.errors) {
    res.status(422).json({
      success: false,
      error: 'Validation failed',
      errors: err.errors,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function createError(message: string, statusCode = 500, code?: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}
