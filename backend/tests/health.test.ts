import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /health', () => {
  const app = createApp();

  it('returns 200 with success envelope', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ok).toBe(true);
    expect(typeof res.body.data.ts).toBe('string');
  });
});

describe('Unknown route', () => {
  const app = createApp();

  it('returns 404 with NOT_FOUND code', async () => {
    const res = await request(app).get('/no-such-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
