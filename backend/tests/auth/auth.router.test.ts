import bcrypt from 'bcrypt';
import request from 'supertest';

jest.mock('../../src/common/prisma', () => ({
  prisma: {
    store: { findUnique: jest.fn() },
    adminUser: { findUnique: jest.fn() },
    table: { findUnique: jest.fn() },
  },
}));

import { prisma } from '../../src/common/prisma';
import { _resetRateLimiter } from '../../src/common/rate-limiter';
import { createApp } from '../../src/app';

const store = { id: 1, code: 'store-demo', name: '데모 매장' };
const admin = {
  id: 1,
  storeId: 1,
  username: 'admin',
  passwordHash: bcrypt.hashSync('Admin1234!', 10),
};
const table = {
  id: 1,
  storeId: 1,
  tableNumber: 1,
  passwordHash: bcrypt.hashSync('0000', 10),
  store,
};

const app = createApp();

beforeEach(() => {
  jest.clearAllMocks();
  _resetRateLimiter();
});

describe('POST /api/v1/admin/auth/login', () => {
  it('returns 200 + token on success', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(store);
    (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(admin);

    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ storeCode: 'store-demo', username: 'admin', password: 'Admin1234!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.store.code).toBe('store-demo');
  });

  it('returns 401 AUTH_INVALID_CREDENTIALS on wrong password', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(store);
    (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(admin);

    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ storeCode: 'store-demo', username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('returns 400 VALIDATION_FAILED on bad body', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ storeCode: 'AB!', username: 'a', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 429 after 5 failed attempts', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(null);

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ storeCode: 'store-x', username: 'admin', password: 'x' });
    }
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ storeCode: 'store-x', username: 'admin', password: 'x' });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('AUTH_TOO_MANY_ATTEMPTS');
  });
});

describe('POST /api/v1/customer/auth/login', () => {
  it('returns 200 + token on success', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(store);
    (prisma.table.findUnique as jest.Mock).mockResolvedValue(table);

    const res = await request(app)
      .post('/api/v1/customer/auth/login')
      .send({ storeCode: 'store-demo', tableNumber: 1, password: '0000' });

    expect(res.status).toBe(200);
    expect(res.body.data.tableNumber).toBe(1);
  });
});

describe('GET /api/v1/customer/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/customer/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
  });

  it('returns 200 with valid token', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(store);
    (prisma.table.findUnique as jest.Mock).mockResolvedValue(table);

    const login = await request(app)
      .post('/api/v1/customer/auth/login')
      .send({ storeCode: 'store-demo', tableNumber: 1, password: '0000' });
    const token = login.body.data.token;

    const res = await request(app)
      .get('/api/v1/customer/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tableId).toBe(1);
  });
});
