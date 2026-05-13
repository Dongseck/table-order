import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('GET /api/v1/customer/orders', () => {
  it('returns 200 with orders array', async () => {
    const res = await request(app).get('/api/v1/customer/orders');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.orders)).toBe(true);
  });
});

describe('GET /api/v1/admin/orders', () => {
  it('returns 200 with tables array', async () => {
    const res = await request(app).get('/api/v1/admin/orders');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tables)).toBe(true);
  });

  it('accepts tableId query filter', async () => {
    const res = await request(app).get('/api/v1/admin/orders?tableId=1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('accepts status query filter', async () => {
    const res = await request(app).get('/api/v1/admin/orders?status=PENDING');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
