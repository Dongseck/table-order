import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async route handler so that thrown errors propagate to Express's
 * error middleware chain (Express 4 doesn't auto-handle Promise rejections).
 */
export function asyncHandler<P = Record<string, unknown>>(
  fn: (req: Request<P>, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as Request<P>, res, next)).catch(next);
  };
}
