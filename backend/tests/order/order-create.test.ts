import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('POST /api/v1/customer/orders', () => {
  it('returns 400 when items array is empty', async () => {
    const res = await request(app)
      .post('/api/v1/customer/orders')
      .send({ items: [], totalAmount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when quantity is out of range', async () => {
    const res = await request(app)
      .post('/api/v1/customer/orders')
      .send({
        items: [{ menuItemId: 1, quantity: 0 }],
        totalAmount: 0,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when items exceed 50', async () => {
    const items = Array.from({ length: 51 }, (_, i) => ({
      menuItemId: i + 1,
      quantity: 1,
    }));

    const res = await request(app)
      .post('/api/v1/customer/orders')
      .send({ items, totalAmount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when totalAmount is missing', async () => {
    const res = await request(app)
      .post('/api/v1/customer/orders')
      .send({ items: [{ menuItemId: 1, quantity: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when duplicate menuItemId is provided', async () => {
    const res = await request(app)
      .post('/api/v1/customer/orders')
      .send({
        items: [
          { menuItemId: 1, quantity: 1 },
          { menuItemId: 1, quantity: 2 },
        ],
        totalAmount: 27000,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});
