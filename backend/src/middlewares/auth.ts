import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/error';
import { ErrorCodes } from '../common/error-codes';
import { verifyAdminToken, verifyTableToken } from '../modules/auth/jwt';

export type AdminAuthContext = { role: 'admin'; adminUserId: number; storeId: number };
export type TableAuthContext = { role: 'table'; tableId: number; storeId: number };
export type AuthContext = AdminAuthContext | TableAuthContext;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim() || null;
  }
  return null;
}

function extractTableToken(req: Request): string | null {
  // Header first; fall back to ?token= for SSE (EventSource cannot set headers)
  const bearer = extractBearer(req);
  if (bearer) return bearer;
  const queryToken = req.query.token;
  if (typeof queryToken === 'string' && queryToken.length > 0) return queryToken;
  return null;
}

export function adminAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    return next(
      new AppError(ErrorCodes.AUTH_TOKEN_INVALID, 'Authorization token required', 401),
    );
  }
  try {
    const { adminUserId, storeId } = verifyAdminToken(token);
    req.auth = { role: 'admin', adminUserId, storeId };
    next();
  } catch (e) {
    next(e);
  }
}

export function tableAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractTableToken(req);
  if (!token) {
    return next(
      new AppError(ErrorCodes.AUTH_TOKEN_INVALID, 'Authorization token required', 401),
    );
  }
  try {
    const { tableId, storeId } = verifyTableToken(token);
    req.auth = { role: 'table', tableId, storeId };
    next();
  } catch (e) {
    next(e);
  }
}
