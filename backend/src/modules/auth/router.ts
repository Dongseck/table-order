import { Router } from 'express';
import { ok } from '../../common/response';
import { validateBody } from '../../common/validation';
import { loginRateLimiter } from '../../common/rate-limiter';
import { asyncHandler } from '../../common/async-handler';
import { tableAuth } from '../../middlewares/auth';
import { authService } from './auth.service';
import { AdminLoginBodySchema, CustomerLoginBodySchema } from './auth.schemas';

export const authRouter = Router();

authRouter.post(
  '/admin/auth/login',
  loginRateLimiter,
  validateBody(AdminLoginBodySchema),
  asyncHandler(async (req, res) => {
    const result = await authService.adminLogin(req.body);
    return ok(res, result);
  }),
);

authRouter.post(
  '/customer/auth/login',
  loginRateLimiter,
  validateBody(CustomerLoginBodySchema),
  asyncHandler(async (req, res) => {
    const result = await authService.tableLogin(req.body);
    return ok(res, result);
  }),
);

authRouter.get(
  '/customer/auth/me',
  tableAuth,
  asyncHandler(async (req, res) => {
    const tableId = req.auth!.role === 'table' ? req.auth!.tableId : 0;
    const result = await authService.getCurrentTable(tableId);
    return ok(res, result);
  }),
);
