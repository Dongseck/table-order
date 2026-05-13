import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from './error';
import { ErrorCodes } from './error-codes';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.httpStatus).json({
      success: false,
      error:
        err.details === undefined
          ? { code: err.code, message: err.message }
          : { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof ZodError) {
    const fields = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Validation failed',
        details: { fields },
      },
    });
  }

  // Unexpected
  console.error('[errorHandler] Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal server error' },
  });
}
