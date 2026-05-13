import request from 'supertest';
import { createApp } from '../../src/app';
import { makeTableToken, makeAdminToken } from '../helpers/auth';

const app = createApp();
const tableToken = makeTableToken();
const adminToken = makeAdminToken();

const hasDb = process.env.DATABASE_URL?.startsWith('postgres');
const describeWithDb = hasDb ? describe : describe.skip;

describeWithDb('GET /api/v1/customer/orders', () => {
  it('returns 200 with orders array', async () => {
    const res = await request(app)
      .get('/api/v1/customer/orders')
      .set('Authorization', `Bearer ${tableToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.orders)).toBe(true);
  });
});

describeWithDb('GET /api/v1/admin/orders', () => {
  it('returns 200 with tables array', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tables)).toBe(true);
  });

  it('accepts tableId query filter', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders?tableId=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('accepts status query filter', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
