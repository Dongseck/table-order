import bcrypt from 'bcrypt';
import { prisma } from '../../common/prisma';
import { AppError } from '../../common/error';
import { ErrorCodes } from '../../common/error-codes';
import { signAdminToken, signTableToken } from './jwt';

interface StoreInfo {
  id: number;
  code: string;
  name: string;
}

function invalidCredentials(): never {
  throw new AppError(
    ErrorCodes.AUTH_INVALID_CREDENTIALS,
    '로그인 정보가 올바르지 않습니다',
    401,
  );
}

export const authService = {
  async adminLogin(input: { storeCode: string; username: string; password: string }) {
    const store = await prisma.store.findUnique({ where: { code: input.storeCode } });
    if (!store) invalidCredentials();

    const admin = await prisma.adminUser.findUnique({
      where: { storeId_username: { storeId: store.id, username: input.username } },
    });
    if (!admin) invalidCredentials();

    const ok = await bcrypt.compare(input.password, admin.passwordHash);
    if (!ok) invalidCredentials();

    const { token, expiresAt } = signAdminToken({
      adminUserId: admin.id,
      storeId: store.id,
    });

    return {
      token,
      expiresAt,
      store: { id: store.id, code: store.code, name: store.name } satisfies StoreInfo,
      username: admin.username,
    };
  },

  async tableLogin(input: { storeCode: string; tableNumber: number; password: string }) {
    const store = await prisma.store.findUnique({ where: { code: input.storeCode } });
    if (!store) invalidCredentials();

    const table = await prisma.table.findUnique({
      where: { storeId_tableNumber: { storeId: store.id, tableNumber: input.tableNumber } },
    });
    if (!table) invalidCredentials();

    const ok = await bcrypt.compare(input.password, table.passwordHash);
    if (!ok) invalidCredentials();

    const { token } = signTableToken({ tableId: table.id, storeId: store.id });

    return {
      token,
      tableId: table.id,
      tableNumber: table.tableNumber,
      store: { id: store.id, code: store.code, name: store.name } satisfies StoreInfo,
    };
  },

  async getCurrentTable(tableId: number) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { store: true },
    });
    if (!table) {
      throw new AppError(ErrorCodes.AUTH_TOKEN_INVALID, 'Table no longer exists', 401);
    }
    return {
      tableId: table.id,
      tableNumber: table.tableNumber,
      store: {
        id: table.store.id,
        code: table.store.code,
        name: table.store.name,
      } satisfies StoreInfo,
    };
  },
};
