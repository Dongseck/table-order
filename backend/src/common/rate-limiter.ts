import type { NextFunction, Request, Response } from 'express';
import { AppError } from './error';
import { ErrorCodes } from './error-codes';
import { RATE_LIMIT_LOGIN_MAX, RATE_LIMIT_LOGIN_WINDOW_MS } from './constants';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function loginRateLimiter(req: Request, _res: Response, next: NextFunction): void {
  const ip = req.ip ?? 'unknown';
  const storeCode =
    (req.body && typeof req.body === 'object' && 'storeCode' in req.body
      ? String((req.body as Record<string, unknown>).storeCode)
      : null) ?? 'anon';
  const key = `${ip}:${storeCode}`;
  const now = Date.now();

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_LOGIN_WINDOW_MS });
    return next();
  }
  if (bucket.count >= RATE_LIMIT_LOGIN_MAX) {
    throw new AppError(
      ErrorCodes.AUTH_TOO_MANY_ATTEMPTS,
      'Too many login attempts. Please wait and try again.',
      429,
    );
  }
  bucket.count += 1;
  next();
}

// Test helper
export function _resetRateLimiter(): void {
  buckets.clear();
}
