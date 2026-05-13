import { Router } from 'express';
import { tableAuth, adminAuth } from '../../middlewares/auth';
import { validateBody, validateQuery } from '../../common/validation';
import { createOrderSchema, updateStatusSchema, adminOrdersQuerySchema } from './order.validation';
import * as controller from './order.controller';

export const orderRouter = Router();

// Customer routes
orderRouter.post('/customer/orders', tableAuth, validateBody(createOrderSchema), controller.createOrder);
orderRouter.get('/customer/orders', tableAuth, controller.getCustomerOrders);

// Admin routes
orderRouter.get('/admin/orders', adminAuth, validateQuery(adminOrdersQuerySchema), controller.getAdminOrders);
orderRouter.patch('/admin/orders/:id/status', adminAuth, validateBody(updateStatusSchema), controller.updateStatus);
orderRouter.delete('/admin/orders/:id', adminAuth, controller.deleteOrder);
