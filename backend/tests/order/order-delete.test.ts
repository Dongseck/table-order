import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('DELETE /api/v1/admin/orders/:id', () => {
  it('returns 404 when order does not exist', async () => {
    const res = await request(app).delete('/api/v1/admin/orders/99999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });
});
