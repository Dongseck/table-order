import type { Response } from 'express';

export function ok<T>(res: Response, data: T, httpStatus = 200): Response {
  return res.status(httpStatus).json({ success: true, data });
}

export function fail(
  res: Response,
  code: string,
  message: string,
  httpStatus: number,
  details?: unknown,
): Response {
  return res.status(httpStatus).json({
    success: false,
    error: details === undefined ? { code, message } : { code, message, details },
  });
}
