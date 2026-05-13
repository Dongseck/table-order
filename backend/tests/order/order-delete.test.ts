import request from 'supertest';
import { createApp } from '../../src/app';
import { makeAdminToken } from '../helpers/auth';

const app = createApp();
const adminToken = makeAdminToken();

const hasDb = process.env.DATABASE_URL?.startsWith('postgres');
const describeWithDb = hasDb ? describe : describe.skip;

describeWithDb('DELETE /api/v1/admin/orders/:id', () => {
  it('returns 404 when order does not exist', async () => {
    const res = await request(app)
      .delete('/api/v1/admin/orders/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });
});
