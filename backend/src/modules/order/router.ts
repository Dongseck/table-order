import { Router } from 'express';

/**
 * Unit 3 (Order) owns this router.
 * Routes to be added:
 *   POST   /customer/orders
 *   GET    /customer/orders
 *   GET    /admin/orders
 *   PATCH  /admin/orders/:id/status
 *   DELETE /admin/orders/:id
 */
export const orderRouter = Router();
