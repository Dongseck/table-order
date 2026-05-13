import { prisma } from '../../common/prisma';
import { AppError } from '../../common/error';
import { ErrorCodes } from '../../common/error-codes';
import { tableSessionService } from '../table/table-session.service';
import { sseManager } from '../sse/sse.manager';
import type { OrderStatus } from '@shared/types/domain';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PREPARING'],
  PREPARING: ['COMPLETED', 'PENDING'],
  COMPLETED: [],
};

interface CreateOrderInput {
  items: Array<{ menuItemId: number; quantity: number }>;
  totalAmount: number;
}

export async function createOrder(tableId: number, storeId: number, input: CreateOrderInput) {
  const menuItemIds = input.items.map((i) => i.menuItemId);

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    include: { category: true },
  });

  for (const item of input.items) {
    const found = menuItems.find((m) => m.id === item.menuItemId);
    if (!found) {
      throw new AppError(ErrorCodes.ORDER_NOT_FOUND, `Menu item ${item.menuItemId} not found`, 404);
    }
    if (found.category.storeId !== storeId) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Menu item does not belong to this store', 403);
    }
  }

  const serverTotal = input.items.reduce((sum, item) => {
    const menu = menuItems.find((m) => m.id === item.menuItemId)!;
    return sum + menu.price * item.quantity;
  }, 0);

  if (serverTotal !== input.totalAmount) {
    throw new AppError(
      ErrorCodes.ORDER_PRICE_MISMATCH,
      'Total amount mismatch',
      409,
      { serverTotal, clientTotal: input.totalAmount },
    );
  }

  const { sessionId } = await tableSessionService.getOrStartActiveSession(tableId);

  const order = await prisma.$transaction(async (tx) => {
    const lastOrder = await tx.order.findFirst({
      where: { sessionId },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

    return tx.order.create({
      data: {
        sessionId,
        tableId,
        orderNumber,
        status: 'PENDING',
        totalAmount: serverTotal,
        items: {
          create: input.items.map((item) => {
            const menu = menuItems.find((m) => m.id === item.menuItemId)!;
            return {
              menuItemName: menu.name,
              unitPrice: menu.price,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });
  });

  const table = await prisma.table.findUniqueOrThrow({ where: { id: tableId } });

  sseManager.broadcast(storeId, {
    type: 'order:new',
    data: {
      orderId: order.id,
      tableId,
      tableNumber: table.tableNumber,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      items: order.items.map((i) => ({
        menuItemName: i.menuItemName,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      createdAt: order.createdAt.toISOString(),
    },
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    status: order.status as OrderStatus,
    createdAt: order.createdAt.toISOString(),
  };
}

export async function getCustomerOrders(tableId: number) {
  const activeSession = await prisma.tableSession.findFirst({
    where: { tableId, endedAt: null },
    orderBy: { startedAt: 'desc' },
  });

  if (!activeSession) {
    return { orders: [] };
  }

  const orders = await prisma.order.findMany({
    where: { sessionId: activeSession.id },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  });

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status as OrderStatus,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({
        id: i.id,
        menuItemName: i.menuItemName,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
    })),
  };
}

export async function getAdminOrders(storeId: number, filters?: { tableId?: number; status?: string }) {
  const tables = await prisma.table.findMany({
    where: { storeId },
    include: {
      sessions: {
        where: { endedAt: null },
        take: 1,
        orderBy: { startedAt: 'desc' },
      },
    },
  });

  const result: Array<{
    tableId: number;
    tableNumber: number;
    totalAmount: number;
    orders: Array<{
      id: number;
      orderNumber: number;
      status: OrderStatus;
      totalAmount: number;
      createdAt: string;
      updatedAt: string;
      items: Array<{ id: number; menuItemName: string; unitPrice: number; quantity: number }>;
    }>;
  }> = [];

  for (const table of tables) {
    if (filters?.tableId && table.id !== filters.tableId) continue;

    const activeSession = table.sessions[0];
    if (!activeSession) {
      result.push({ tableId: table.id, tableNumber: table.tableNumber, totalAmount: 0, orders: [] });
      continue;
    }

    const whereClause: { sessionId: number; status?: string } = { sessionId: activeSession.id };
    if (filters?.status) whereClause.status = filters.status;

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    result.push({
      tableId: table.id,
      tableNumber: table.tableNumber,
      totalAmount,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status as OrderStatus,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        items: o.items.map((i) => ({
          id: i.id,
          menuItemName: i.menuItemName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      })),
    });
  }

  return { tables: result };
}

export async function updateOrderStatus(orderId: number, status: OrderStatus, storeId: number) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError(ErrorCodes.ORDER_NOT_FOUND, 'Order not found', 404);
  }

  const table = await prisma.table.findUnique({ where: { id: order.tableId } });
  if (!table || table.storeId !== storeId) {
    throw new AppError(ErrorCodes.ORDER_NOT_FOUND, 'Order not found', 404);
  }

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    throw new AppError(
      ErrorCodes.ORDER_INVALID_STATUS_TRANSITION,
      `Cannot transition from ${order.status} to ${status}`,
      409,
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: { items: true },
  });

  sseManager.broadcast(storeId, {
    type: 'order:status',
    data: { orderId, status },
  });

  return {
    id: updated.id,
    orderNumber: updated.orderNumber,
    status: updated.status as OrderStatus,
    totalAmount: updated.totalAmount,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    items: updated.items.map((i) => ({
      id: i.id,
      menuItemName: i.menuItemName,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
  };
}

export async function deleteOrder(orderId: number, storeId: number) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError(ErrorCodes.ORDER_NOT_FOUND, 'Order not found', 404);
  }

  const table = await prisma.table.findUnique({ where: { id: order.tableId } });
  if (!table || table.storeId !== storeId) {
    throw new AppError(ErrorCodes.ORDER_NOT_FOUND, 'Order not found', 404);
  }

  if (order.status === 'COMPLETED') {
    throw new AppError(
      ErrorCodes.ORDER_INVALID_STATUS_TRANSITION,
      'Cannot delete a completed order',
      409,
    );
  }

  await prisma.order.delete({ where: { id: orderId } });

  sseManager.broadcast(storeId, {
    type: 'order:deleted',
    data: { orderId, tableId: order.tableId },
  });

  return { message: '주문이 삭제되었습니다' };
}
