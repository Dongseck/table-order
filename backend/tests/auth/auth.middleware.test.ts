import express from 'express';
import request from 'supertest';
import { adminAuth, tableAuth } from '../../src/middlewares/auth';
import { errorHandler } from '../../src/common/error-handler';
import { signAdminToken, signTableToken } from '../../src/modules/auth/jwt';

function makeApp() {
  const app = express();
  app.get('/admin-protected', adminAuth, (req, res) => {
    res.json({ success: true, data: req.auth });
  });
  app.get('/table-protected', tableAuth, (req, res) => {
    res.json({ success: true, data: req.auth });
  });
  app.use(errorHandler);
  return app;
}

describe('adminAuth middleware', () => {
  const app = makeApp();

  it('401 when token absent', async () => {
    const res = await request(app).get('/admin-protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
  });

  it('401 with invalid token', async () => {
    const res = await request(app)
      .get('/admin-protected')
      .set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
  });

  it('200 with valid admin token', async () => {
    const { token } = signAdminToken({ adminUserId: 1, storeId: 1 });
    const res = await request(app)
      .get('/admin-protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ role: 'admin', adminUserId: 1, storeId: 1 });
  });

  it('401 if table token passed to admin route', async () => {
    const { token } = signTableToken({ tableId: 1, storeId: 1 });
    const res = await request(app)
      .get('/admin-protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe('tableAuth middleware', () => {
  const app = makeApp();

  it('accepts token from header', async () => {
    const { token } = signTableToken({ tableId: 5, storeId: 1 });
    const res = await request(app)
      .get('/table-protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ role: 'table', tableId: 5, storeId: 1 });
  });

  it('accepts token from ?token= query string (SSE-style)', async () => {
    const { token } = signTableToken({ tableId: 7, storeId: 1 });
    const res = await request(app).get(`/table-protected?token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.tableId).toBe(7);
  });
});
