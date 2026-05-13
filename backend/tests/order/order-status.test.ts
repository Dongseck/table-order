import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('PATCH /api/v1/admin/orders/:id/status', () => {
  it('returns 400 when status is invalid', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/orders/1/status')
      .send({ status: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 404 when order does not exist', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/orders/99999/status')
      .send({ status: 'PREPARING' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });
});
