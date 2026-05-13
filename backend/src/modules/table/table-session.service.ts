import { prisma } from '../../common/prisma';

export interface ITableSessionService {
  getOrStartActiveSession(tableId: number): Promise<{ sessionId: number }>;
  completeSession(tableId: number): Promise<{ archivedOrders: number }>;
}

/**
 * Foundation stub.
 *
 * - `getOrStartActiveSession` is fully functional so Unit 3 (Order) can start integrating
 *   immediately without waiting for Unit 4.
 * - `completeSession` is intentionally NOT_IMPLEMENTED — Unit 4 owns the full archival flow
 *   (it should use `archiveSessionOrders` from order/order.archive.ts).
 */
class StubTableSessionService implements ITableSessionService {
  async getOrStartActiveSession(tableId: number): Promise<{ sessionId: number }> {
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

  async completeSession(_tableId: number): Promise<{ archivedOrders: number }> {
    throw new Error('NOT_IMPLEMENTED: Unit 4 (Table) owns completeSession');
  }
}

export const tableSessionService: ITableSessionService = new StubTableSessionService();
