/**
 * Foundation owns app.ts. All routers are pre-registered here so each Unit owner
 * only edits their own module/router.ts file — never this file.
 */
import express, { type Express } from 'express';
import cors from 'cors';
import { requestLogger } from './middlewares/request-logger';
import { errorHandler } from './common/error-handler';
import { notFoundHandler } from './middlewares/not-found';

import { authRouter } from './modules/auth/router';
import { menuRouter } from './modules/menu/router';
import { orderRouter } from './modules/order/router';
import { sseRouter } from './modules/sse/router';
import { tableRouter } from './modules/table/router';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { ok: true, ts: new Date().toISOString() } });
  });

  // Domain routers (Foundation pre-registers; each Unit fills their router.ts)
  app.use('/api/v1', authRouter);
  app.use('/api/v1', menuRouter);
  app.use('/api/v1', orderRouter);
  app.use('/api/v1', sseRouter);
  app.use('/api/v1', tableRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
