import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('GET /api/v1/admin/sse/orders', () => {
  it('returns 200 with event-stream content type', (done) => {
    const req = request(app)
      .get('/api/v1/admin/sse/orders')
      .set('Accept', 'text/event-stream');

    req.expect(200)
      .expect('content-type', /text\/event-stream/)
      .then(() => done())
      .catch(done);
  });
});
