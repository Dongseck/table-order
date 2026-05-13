import type { Request, Response } from 'express';
import { ErrorCodes } from '../common/error-codes';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: ErrorCodes.NOT_FOUND, message: 'Route not found' },
  });
}
