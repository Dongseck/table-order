import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

export function makeAdminToken(adminUserId = 1, storeId = 1): string {
  return jwt.sign({ sub: adminUserId, storeId, role: 'admin' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

export function makeTableToken(tableId = 1, storeId = 1): string {
  return jwt.sign({ storeId, tableId, role: 'table' }, JWT_SECRET, { algorithm: 'HS256' });
}
