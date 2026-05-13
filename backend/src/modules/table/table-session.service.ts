import { prisma } from '../../common/prisma';
import { AppError } from '../../common/error';
import { ErrorCodes } from '../../common/error-codes';
import { archiveSessionOrders } from '../order/order.archive';

export async function getOrStartActiveSession(tableId: number): Promise<{ sessionId: number }> {
  const active = await prisma.tableSession.findFirst({
    where: { tableId, endedAt: null },
    orderBy: { startedAt: 'desc' },
  });
  if (active) return { sessionId: active.id };

  const created = await prisma.tableSession.create({
    data: { tableId, startedAt: new Date() },
  });
  await prisma.table.update({
    where: { id: tableId },
    data: { currentSessionId: created.id },
  });
  return { sessionId: created.id };
}

export async function completeSession(tableId: number, storeId: number): Promise<{ archivedOrders: number }> {
  const table = await prisma.table.findFirst({ where: { id: tableId, storeId } });
  if (!table) {
    throw new AppError(ErrorCodes.TABLE_NOT_FOUND, '테이블을 찾을 수 없습니다', 404);
  }

  const activeSession = await prisma.tableSession.findFirst({
    where: { tableId, endedAt: null },
  });
  if (!activeSession) {
    throw new AppError(ErrorCodes.SESSION_NOT_ACTIVE, '활성 세션이 없습니다', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const { archivedOrders } = await archiveSessionOrders(tx, activeSession.id);

    await tx.tableSession.update({
      where: { id: activeSession.id },
      data: { endedAt: new Date() },
    });

    await tx.table.update({
      where: { id: tableId },
      data: { currentSessionId: null },
    });

    return { archivedOrders };
  });

  // TODO: 통합 시 sseManager.broadcast(storeId, 'table:completed', { tableId }) 연결
  return result;
}

export async function getSessionHistory(tableId: number, storeId: number, date?: string) {
  const table = await prisma.table.findFirst({ where: { id: tableId, storeId } });
  if (!table) {
    throw new AppError(ErrorCodes.TABLE_NOT_FOUND, '테이블을 찾을 수 없습니다', 404);
  }

  const where: Record<string, unknown> = { tableId };
  if (date) {
    const start = new Date(`${date}T00:00:00+09:00`);
    const end = new Date(`${date}T23:59:59.999+09:00`);
    where.archivedAt = { gte: start, lte: end };
  }

  const histories = await prisma.orderHistory.findMany({
    where,
    include: { items: true },
    orderBy: { orderedAt: 'desc' },
  });

  // 세션별 그룹화
  const sessionMap = new Map<number, {
    sessionId: number;
    sessionStartedAt: string;
    sessionEndedAt: string;
    totalAmount: number;
    orders: typeof histories;
  }>();

  for (const h of histories) {
    if (!sessionMap.has(h.sessionId)) {
      sessionMap.set(h.sessionId, {
        sessionId: h.sessionId,
        sessionStartedAt: h.sessionStartedAt.toISOString(),
        sessionEndedAt: h.sessionEndedAt.toISOString(),
        totalAmount: 0,
        orders: [],
      });
    }
    const group = sessionMap.get(h.sessionId)!;
    group.totalAmount += h.totalAmount;
    group.orders.push(h);
  }

  return Array.from(sessionMap.values()).map((session) => ({
    sessionId: session.sessionId,
    startedAt: session.sessionStartedAt,
    endedAt: session.sessionEndedAt,
    totalAmount: session.totalAmount,
    orders: session.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.orderedAt.toISOString(),
      items: o.items.map((i) => ({
        menuItemName: i.menuItemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    })),
  }));
}
