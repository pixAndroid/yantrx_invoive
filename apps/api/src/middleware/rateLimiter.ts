import rateLimit from 'express-rate-limit';

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export function rateLimiter(options: RateLimiterOptions = {}) {
  return rateLimit({
    windowMs: options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: options.max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    message: {
      success: false,
      error: options.message || 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
  });
}
