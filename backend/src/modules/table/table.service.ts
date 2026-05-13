import { prisma } from '../../common/prisma';
import { AppError } from '../../common/error';
import { ErrorCodes } from '../../common/error-codes';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function getTablesByStore(storeId: number) {
  const tables = await prisma.table.findMany({
    where: { storeId },
    orderBy: { tableNumber: 'asc' },
    include: {
      sessions: {
        where: { endedAt: null },
        take: 1,
        select: { id: true },
      },
    },
  });

  return tables.map((t) => ({
    id: t.id,
    storeId: t.storeId,
    tableNumber: t.tableNumber,
    currentSessionId: t.sessions[0]?.id ?? null,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function createTable(storeId: number, tableNumber: number, password: string) {
  const existing = await prisma.table.findUnique({
    where: { storeId_tableNumber: { storeId, tableNumber } },
  });

  if (existing) {
    throw new AppError(ErrorCodes.DUPLICATE_TABLE_NUMBER, `테이블 ${tableNumber}번이 이미 존재합니다`, 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const table = await prisma.table.create({
    data: { storeId, tableNumber, passwordHash },
  });

  return {
    id: table.id,
    storeId: table.storeId,
    tableNumber: table.tableNumber,
    currentSessionId: null,
    createdAt: table.createdAt.toISOString(),
  };
}

export async function updateTable(tableId: number, storeId: number, data: { tableNumber?: number; password?: string }) {
  const table = await prisma.table.findFirst({ where: { id: tableId, storeId } });
  if (!table) {
    throw new AppError(ErrorCodes.TABLE_NOT_FOUND, '테이블을 찾을 수 없습니다', 404);
  }

  if (data.tableNumber !== undefined) {
    const dup = await prisma.table.findFirst({
      where: { storeId, tableNumber: data.tableNumber, id: { not: tableId } },
    });
    if (dup) {
      throw new AppError(ErrorCodes.DUPLICATE_TABLE_NUMBER, `테이블 ${data.tableNumber}번이 이미 존재합니다`, 409);
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.tableNumber !== undefined) updateData.tableNumber = data.tableNumber;
  if (data.password !== undefined) updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const updated = await prisma.table.update({
    where: { id: tableId },
    data: updateData,
  });

  return {
    id: updated.id,
    storeId: updated.storeId,
    tableNumber: updated.tableNumber,
    currentSessionId: updated.currentSessionId,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function deleteTable(tableId: number, storeId: number) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, storeId },
    include: { sessions: { where: { endedAt: null }, take: 1 } },
  });

  if (!table) {
    throw new AppError(ErrorCodes.TABLE_NOT_FOUND, '테이블을 찾을 수 없습니다', 404);
  }

  if (table.sessions.length > 0) {
    throw new AppError(ErrorCodes.TABLE_HAS_ACTIVE_SESSION, '활성 세션이 있는 테이블은 삭제할 수 없습니다', 400);
  }

  await prisma.table.delete({ where: { id: tableId } });
}
