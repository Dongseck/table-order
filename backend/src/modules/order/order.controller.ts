import type { Request, Response, NextFunction } from 'express';
import { ok } from '../../common/response';
import * as orderService from './order.service';

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { tableId, storeId } = req.auth as { tableId: number; storeId: number };
    const result = await orderService.createOrder(tableId, storeId, req.body);
    ok(res, { order: result }, 201);
  } catch (e) {
    next(e);
  }
}

export async function getCustomerOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { tableId } = req.auth as { tableId: number };
    const result = await orderService.getCustomerOrders(tableId);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function getAdminOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { storeId } = req.auth as { storeId: number };
    const filters: { tableId?: number; status?: string } = {};
    if (req.query.tableId) filters.tableId = Number(req.query.tableId);
    if (req.query.status) filters.status = req.query.status as string;
    const result = await orderService.getAdminOrders(storeId, filters);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { storeId } = req.auth as { storeId: number };
    const orderId = Number(req.params.id);
    const { status } = req.body;
    const result = await orderService.updateOrderStatus(orderId, status, storeId);
    ok(res, { order: result });
  } catch (e) {
    next(e);
  }
}

export async function deleteOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { storeId } = req.auth as { storeId: number };
    const orderId = Number(req.params.id);
    const result = await orderService.deleteOrder(orderId, storeId);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}
