import { Router } from 'express';
import { adminAuth } from '../../middlewares/auth';
import { connectSse } from './sse.controller';

export const sseRouter = Router();

sseRouter.get('/admin/sse/orders', adminAuth, connectSse);
