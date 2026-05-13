import request from 'supertest';
import { createApp } from '../../src/app';
import { makeAdminToken } from '../helpers/auth';

const app = createApp();
const adminToken = makeAdminToken();

const hasDb = process.env.DATABASE_URL?.startsWith('postgres');
const describeWithDb = hasDb ? describe : describe.skip;

describe('PATCH /api/v1/admin/orders/:id/status', () => {
  it('returns 400 when status is invalid', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/orders/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describeWithDb('PATCH /api/v1/admin/orders/:id/status (DB)', () => {
  it('returns 404 when order does not exist', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/orders/99999/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PREPARING' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });
});
