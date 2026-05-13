import type { Prisma } from '@prisma/client';

/**
 * Archive all orders of an active session into OrderHistory snapshots and delete originals.
 *
 * Foundation provides a working implementation — both Unit 3 (Order) and Unit 4 (Table) can call
 * this as-is during integration. Caller must provide a transaction context.
 *
 * @param tx        Prisma TransactionClient
 * @param sessionId Active session id whose orders will be archived
 * @returns         Number of orders archived
 */
export async function archiveSessionOrders(
  tx: Prisma.TransactionClient,
  sessionId: number,
): Promise<{ archivedOrders: number }> {
  const session = await tx.tableSession.findUniqueOrThrow({ where: { id: sessionId } });
  const orders = await tx.order.findMany({
    where: { sessionId },
    include: { items: true },
  });

  for (const order of orders) {
    const table = await tx.table.findUniqueOrThrow({ where: { id: order.tableId } });
    await tx.orderHistory.create({
      data: {
        tableId: order.tableId,
        tableNumber: table.tableNumber,
        sessionId: order.sessionId,
        sessionStartedAt: session.startedAt,
        sessionEndedAt: session.endedAt ?? new Date(),
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        orderedAt: order.createdAt,
        items: {
          create: order.items.map((i) => ({
            menuItemName: i.menuItemName,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
          })),
        },
      },
    });
  }

  await tx.orderItem.deleteMany({ where: { order: { sessionId } } });
  await tx.order.deleteMany({ where: { sessionId } });

  return { archivedOrders: orders.length };
}
