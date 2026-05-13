import type { NextFunction, Request, Response } from 'express';

/**
 * Auth context attached to req.auth by adminAuth/tableAuth middlewares.
 * Unit 1 (Auth) replaces these stubs with real JWT verification.
 */
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

/**
 * Foundation stub for adminAuth middleware.
 * Always succeeds as the seeded admin (adminUserId=1, storeId=1).
 * Unit 1 will replace with real JWT verification.
 */
export function adminAuth(req: Request, _res: Response, next: NextFunction): void {
  req.auth = { role: 'admin', adminUserId: 1, storeId: 1 };
  next();
}

/**
 * Foundation stub for tableAuth middleware.
 * Always succeeds as the seeded table 1 (tableId=1, storeId=1).
 * Unit 1 will replace with real JWT verification.
 */
export function tableAuth(req: Request, _res: Response, next: NextFunction): void {
  req.auth = { role: 'table', tableId: 1, storeId: 1 };
  next();
}
