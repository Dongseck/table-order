import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from '../../common/error';
import { ErrorCodes } from '../../common/error-codes';

interface AdminPayload {
  sub: number; // adminUserId
  storeId: number;
  role: 'admin';
}

interface TablePayload {
  storeId: number;
  tableId: number;
  role: 'table';
}

export function signAdminToken(input: {
  adminUserId: number;
  storeId: number;
}): { token: string; expiresAt: string } {
  const payload: Omit<AdminPayload, 'iat' | 'exp'> = {
    sub: input.adminUserId,
    storeId: input.storeId,
    role: 'admin',
  };
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };
  const token = jwt.sign(payload, config.jwtSecret, options);
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000).toISOString();
  return { token, expiresAt };
}

export function signTableToken(input: {
  tableId: number;
  storeId: number;
}): { token: string } {
  const payload: TablePayload = {
    storeId: input.storeId,
    tableId: input.tableId,
    role: 'table',
  };
  const token = jwt.sign(payload, config.jwtSecret, { algorithm: 'HS256' });
  return { token };
}

export function verifyAdminToken(token: string): { adminUserId: number; storeId: number } {
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    }) as unknown as AdminPayload;
    if (payload.role !== 'admin' || typeof payload.sub !== 'number') {
      throw new AppError(ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid token', 401);
    }
    return { adminUserId: payload.sub, storeId: payload.storeId };
  } catch (e) {
    if (e instanceof AppError) throw e;
    if ((e as Error).name === 'TokenExpiredError') {
      throw new AppError(ErrorCodes.AUTH_TOKEN_EXPIRED, 'Token expired', 401);
    }
    throw new AppError(ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid token', 401);
  }
}

export function verifyTableToken(token: string): { tableId: number; storeId: number } {
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    }) as unknown as TablePayload;
    if (payload.role !== 'table' || typeof payload.tableId !== 'number') {
      throw new AppError(ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid token', 401);
    }
    return { tableId: payload.tableId, storeId: payload.storeId };
  } catch (e) {
    if (e instanceof AppError) throw e;
    if ((e as Error).name === 'TokenExpiredError') {
      throw new AppError(ErrorCodes.AUTH_TOKEN_EXPIRED, 'Token expired', 401);
    }
    throw new AppError(ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid token', 401);
  }
}
