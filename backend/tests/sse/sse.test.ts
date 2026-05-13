import request from 'supertest';
import { createApp } from '../../src/app';
import { makeAdminToken } from '../helpers/auth';

const app = createApp();
const adminToken = makeAdminToken();

describe('GET /api/v1/admin/sse/orders', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .get('/api/v1/admin/sse/orders');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
