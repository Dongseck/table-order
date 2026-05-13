import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_COST = 10;

async function main() {
  // Clean slate (idempotent seed)
  await prisma.orderHistoryItem.deleteMany();
  await prisma.orderHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.tableSession.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.store.deleteMany();

  // Store
  const store = await prisma.store.create({
    data: { code: 'store-demo', name: '데모 매장' },
  });

  // Admin
  await prisma.adminUser.create({
    data: {
      storeId: store.id,
      username: 'admin',
      passwordHash: await bcrypt.hash('Admin1234!', BCRYPT_COST),
    },
  });

  // Tables 1~10 with password "0000"
  const tablePasswordHash = await bcrypt.hash('0000', BCRYPT_COST);
  for (let n = 1; n <= 10; n++) {
    await prisma.table.create({
      data: { storeId: store.id, tableNumber: n, passwordHash: tablePasswordHash },
    });
  }

  // Categories
  const meal = await prisma.category.create({
    data: { storeId: store.id, name: '식사', sortOrder: 1 },
  });
  const side = await prisma.category.create({
    data: { storeId: store.id, name: '사이드', sortOrder: 2 },
  });
  const drink = await prisma.category.create({
    data: { storeId: store.id, name: '음료', sortOrder: 3 },
  });

  // MenuItems
  const items: Array<{ categoryId: number; name: string; price: number; sortOrder: number }> = [
    { categoryId: meal.id, name: '김치찌개', price: 9000, sortOrder: 1 },
    { categoryId: meal.id, name: '된장찌개', price: 9000, sortOrder: 2 },
    { categoryId: meal.id, name: '비빔밥', price: 10000, sortOrder: 3 },
    { categoryId: side.id, name: '계란말이', price: 6000, sortOrder: 1 },
    { categoryId: side.id, name: '김치전', price: 8000, sortOrder: 2 },
    { categoryId: side.id, name: '잡채', price: 12000, sortOrder: 3 },
    { categoryId: drink.id, name: '콜라', price: 2000, sortOrder: 1 },
    { categoryId: drink.id, name: '사이다', price: 2000, sortOrder: 2 },
    { categoryId: drink.id, name: '식혜', price: 3000, sortOrder: 3 },
  ];
  for (const item of items) {
    await prisma.menuItem.create({ data: item });
  }

  console.log('Seed completed:');
  console.log('  Store: store-demo / 데모 매장');
  console.log('  Admin: admin / Admin1234!');
  console.log('  Tables: 10 (password=0000)');
  console.log('  Categories: 3, MenuItems: 9');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
