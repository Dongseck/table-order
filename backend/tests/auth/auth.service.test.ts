import bcrypt from 'bcrypt';

jest.mock('../../src/common/prisma', () => ({
  prisma: {
    store: { findUnique: jest.fn() },
    adminUser: { findUnique: jest.fn() },
    table: { findUnique: jest.fn() },
  },
}));

import { prisma } from '../../src/common/prisma';
import { authService } from '../../src/modules/auth/auth.service';
import { AppError } from '../../src/common/error';
import { ErrorCodes } from '../../src/common/error-codes';

const store = { id: 1, code: 'store-demo', name: '데모 매장' };
const admin = {
  id: 1,
  storeId: 1,
  username: 'admin',
  passwordHash: bcrypt.hashSync('Admin1234!', 10),
};
const table = {
  id: 1,
  storeId: 1,
  tableNumber: 1,
  passwordHash: bcrypt.hashSync('0000', 10),
  store,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authService.adminLogin', () => {
  it('returns token + store on success', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(store);
    (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(admin);

    const res = await authService.adminLogin({
      storeCode: 'store-demo',
      username: 'admin',
      password: 'Admin1234!',
    });

    expect(res.token).toEqual(expect.any(String));
    expect(res.store).toEqual(store);
    expect(res.username).toBe('admin');
    expect(res.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('rejects unknown store with AUTH_INVALID_CREDENTIALS', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(
      authService.adminLogin({ storeCode: 'nope', username: 'admin', password: 'x' }),
    ).rejects.toMatchObject({ code: ErrorCodes.AUTH_INVALID_CREDENTIALS });
  });

  it('rejects unknown user', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(store);
    (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(
      authService.adminLogin({ storeCode: 'store-demo', username: 'ghost', password: 'x' }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('rejects wrong password', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(store);
    (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(admin);
    await expect(
      authService.adminLogin({
        storeCode: 'store-demo',
        username: 'admin',
        password: 'wrong',
      }),
    ).rejects.toMatchObject({ code: ErrorCodes.AUTH_INVALID_CREDENTIALS });
  });
});

describe('authService.tableLogin', () => {
  it('returns token on success', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(store);
    (prisma.table.findUnique as jest.Mock).mockResolvedValue(table);

    const res = await authService.tableLogin({
      storeCode: 'store-demo',
      tableNumber: 1,
      password: '0000',
    });

    expect(res.tableId).toBe(1);
    expect(res.tableNumber).toBe(1);
    expect(res.token).toEqual(expect.any(String));
  });

  it('rejects wrong password', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(store);
    (prisma.table.findUnique as jest.Mock).mockResolvedValue(table);
    await expect(
      authService.tableLogin({ storeCode: 'store-demo', tableNumber: 1, password: 'wrong' }),
    ).rejects.toMatchObject({ code: ErrorCodes.AUTH_INVALID_CREDENTIALS });
  });
});

describe('authService.getCurrentTable', () => {
  it('returns table info', async () => {
    (prisma.table.findUnique as jest.Mock).mockResolvedValue(table);
    const res = await authService.getCurrentTable(1);
    expect(res.tableNumber).toBe(1);
    expect(res.store.code).toBe('store-demo');
  });

  it('throws AUTH_TOKEN_INVALID when table missing', async () => {
    (prisma.table.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(authService.getCurrentTable(999)).rejects.toMatchObject({
      code: ErrorCodes.AUTH_TOKEN_INVALID,
    });
  });
});
