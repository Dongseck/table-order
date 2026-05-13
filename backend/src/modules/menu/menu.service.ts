import { prisma } from '../../common/prisma';
import { AppError } from '../../common/error';
import { ErrorCodes } from '../../common/error-codes';

// ── Customer ────────────────────────────────────────────────────

export async function getCustomerMenus(storeId: number) {
  const categories = await prisma.category.findMany({
    where: { storeId },
    orderBy: { sortOrder: 'asc' },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
    },
  });
  return { categories };
}

// ── Admin Category ──────────────────────────────────────────────

export async function listCategories(storeId: number) {
  const categories = await prisma.category.findMany({
    where: { storeId },
    orderBy: { sortOrder: 'asc' },
  });
  return { categories };
}

export async function createCategory(storeId: number, name: string, sortOrder?: number) {
  const existing = await prisma.category.findFirst({ where: { storeId, name } });
  if (existing) {
    throw new AppError(ErrorCodes.DUPLICATE_CATEGORY_NAME, 'Category name already exists', 409);
  }

  const maxSort = await prisma.category.aggregate({
    where: { storeId },
    _max: { sortOrder: true },
  });
  const finalSort = sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1;

  const category = await prisma.category.create({
    data: { storeId, name, sortOrder: finalSort },
  });
  return { category };
}

export async function updateCategory(storeId: number, id: number, data: { name?: string; sortOrder?: number }) {
  const category = await prisma.category.findFirst({ where: { id, storeId } });
  if (!category) {
    throw new AppError(ErrorCodes.CATEGORY_NOT_FOUND, 'Category not found', 404);
  }

  if (data.name && data.name !== category.name) {
    const dup = await prisma.category.findFirst({ where: { storeId, name: data.name, id: { not: id } } });
    if (dup) {
      throw new AppError(ErrorCodes.DUPLICATE_CATEGORY_NAME, 'Category name already exists', 409);
    }
  }

  const updated = await prisma.category.update({ where: { id }, data });
  return { category: updated };
}

export async function deleteCategory(storeId: number, id: number) {
  const category = await prisma.category.findFirst({ where: { id, storeId } });
  if (!category) {
    throw new AppError(ErrorCodes.CATEGORY_NOT_FOUND, 'Category not found', 404);
  }

  const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    throw new AppError(ErrorCodes.CATEGORY_HAS_ITEMS, 'Category still has menu items', 409);
  }

  await prisma.category.delete({ where: { id } });
}

export async function reorderCategories(storeId: number, orderedIds: number[]) {
  const categories = await prisma.category.findMany({ where: { storeId }, select: { id: true } });
  const existingIds = new Set(categories.map((c) => c.id));

  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      throw new AppError(ErrorCodes.CATEGORY_NOT_FOUND, `Category ${id} not found`, 404);
    }
  }

  await prisma.$transaction(
    orderedIds.map((id, idx) => prisma.category.update({ where: { id }, data: { sortOrder: idx } })),
  );
}

// ── Admin Menu Item ─────────────────────────────────────────────

export async function listMenuItems(storeId: number, categoryId?: number) {
  const where = categoryId
    ? { categoryId, category: { storeId } }
    : { category: { storeId } };

  const menuItems = await prisma.menuItem.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });
  return { menuItems };
}

export async function createMenuItem(
  storeId: number,
  data: { categoryId: number; name: string; price: number; description?: string; imageUrl?: string; sortOrder?: number },
) {
  const category = await prisma.category.findFirst({ where: { id: data.categoryId, storeId } });
  if (!category) {
    throw new AppError(ErrorCodes.CATEGORY_NOT_FOUND, 'Category not found', 404);
  }

  const maxSort = await prisma.menuItem.aggregate({
    where: { categoryId: data.categoryId },
    _max: { sortOrder: true },
  });
  const finalSort = data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1;

  const menuItem = await prisma.menuItem.create({
    data: {
      categoryId: data.categoryId,
      name: data.name,
      price: data.price,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      sortOrder: finalSort,
    },
  });
  return { menuItem };
}

export async function updateMenuItem(
  storeId: number,
  id: number,
  data: { categoryId?: number; name?: string; price?: number; description?: string | null; imageUrl?: string | null; sortOrder?: number },
) {
  const item = await prisma.menuItem.findFirst({ where: { id, category: { storeId } } });
  if (!item) {
    throw new AppError(ErrorCodes.MENU_NOT_FOUND, 'Menu item not found', 404);
  }

  if (data.categoryId !== undefined) {
    const category = await prisma.category.findFirst({ where: { id: data.categoryId, storeId } });
    if (!category) {
      throw new AppError(ErrorCodes.CATEGORY_NOT_FOUND, 'Category not found', 404);
    }
  }

  const menuItem = await prisma.menuItem.update({ where: { id }, data });
  return { menuItem };
}

export async function deleteMenuItem(storeId: number, id: number) {
  const item = await prisma.menuItem.findFirst({ where: { id, category: { storeId } } });
  if (!item) {
    throw new AppError(ErrorCodes.MENU_NOT_FOUND, 'Menu item not found', 404);
  }

  await prisma.menuItem.delete({ where: { id } });
}

export async function reorderMenuItems(storeId: number, categoryId: number, orderedIds: number[]) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, storeId } });
  if (!category) {
    throw new AppError(ErrorCodes.CATEGORY_NOT_FOUND, 'Category not found', 404);
  }

  const items = await prisma.menuItem.findMany({ where: { categoryId }, select: { id: true } });
  const existingIds = new Set(items.map((i) => i.id));

  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      throw new AppError(ErrorCodes.MENU_NOT_FOUND, `Menu item ${id} not found in category`, 404);
    }
  }

  await prisma.$transaction(
    orderedIds.map((id, idx) => prisma.menuItem.update({ where: { id }, data: { sortOrder: idx } })),
  );
}
