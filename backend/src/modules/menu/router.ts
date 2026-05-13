import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminAuth, tableAuth } from '../../middlewares/auth';
import { validateBody } from '../../common/validation';
import {
  CategoryNameSchema,
  MenuNameSchema,
  MenuDescriptionSchema,
  PriceSchema,
  ImageUrlSchema,
} from '../../common/validation';
import { ok } from '../../common/response';
import * as menuService from './menu.service';

export const menuRouter = Router();

function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ── Customer ────────────────────────────────────────────────────

menuRouter.get(
  '/customer/menus',
  tableAuth,
  wrap(async (req, res) => {
    const result = await menuService.getCustomerMenus(req.auth!.storeId);
    ok(res, result);
  }),
);

// ── Admin Category ──────────────────────────────────────────────

const createCategorySchema = z.object({
  name: CategoryNameSchema,
  sortOrder: z.number().int().min(0).optional(),
});

const updateCategorySchema = z.object({
  name: CategoryNameSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const reorderCategoriesSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1),
});

menuRouter.get(
  '/admin/categories',
  adminAuth,
  wrap(async (req, res) => {
    const result = await menuService.listCategories(req.auth!.storeId);
    ok(res, result);
  }),
);

menuRouter.post(
  '/admin/categories',
  adminAuth,
  validateBody(createCategorySchema),
  wrap(async (req, res) => {
    const { name, sortOrder } = req.body;
    const result = await menuService.createCategory(req.auth!.storeId, name, sortOrder);
    ok(res, result, 201);
  }),
);

menuRouter.patch(
  '/admin/categories/reorder',
  adminAuth,
  validateBody(reorderCategoriesSchema),
  wrap(async (req, res) => {
    await menuService.reorderCategories(req.auth!.storeId, req.body.orderedIds);
    ok(res, { success: true });
  }),
);

menuRouter.patch(
  '/admin/categories/:id',
  adminAuth,
  validateBody(updateCategorySchema),
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const result = await menuService.updateCategory(req.auth!.storeId, id, req.body);
    ok(res, result);
  }),
);

menuRouter.delete(
  '/admin/categories/:id',
  adminAuth,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    await menuService.deleteCategory(req.auth!.storeId, id);
    ok(res, null, 204);
  }),
);

// ── Admin Menu Item ─────────────────────────────────────────────

const createMenuItemSchema = z.object({
  categoryId: z.number().int().positive(),
  name: MenuNameSchema,
  price: PriceSchema,
  description: MenuDescriptionSchema,
  imageUrl: ImageUrlSchema,
  sortOrder: z.number().int().min(0).optional(),
});

const updateMenuItemSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  name: MenuNameSchema.optional(),
  price: PriceSchema.optional(),
  description: MenuDescriptionSchema,
  imageUrl: ImageUrlSchema,
  sortOrder: z.number().int().min(0).optional(),
});

const reorderMenuItemsSchema = z.object({
  categoryId: z.number().int().positive(),
  orderedIds: z.array(z.number().int().positive()).min(1),
});

menuRouter.get(
  '/admin/menus',
  adminAuth,
  wrap(async (req, res) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const result = await menuService.listMenuItems(req.auth!.storeId, categoryId);
    ok(res, result);
  }),
);

menuRouter.post(
  '/admin/menus',
  adminAuth,
  validateBody(createMenuItemSchema),
  wrap(async (req, res) => {
    const result = await menuService.createMenuItem(req.auth!.storeId, req.body);
    ok(res, result, 201);
  }),
);

menuRouter.patch(
  '/admin/menus/reorder',
  adminAuth,
  validateBody(reorderMenuItemsSchema),
  wrap(async (req, res) => {
    const { categoryId, orderedIds } = req.body;
    await menuService.reorderMenuItems(req.auth!.storeId, categoryId, orderedIds);
    ok(res, { success: true });
  }),
);

menuRouter.patch(
  '/admin/menus/:id',
  adminAuth,
  validateBody(updateMenuItemSchema),
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const result = await menuService.updateMenuItem(req.auth!.storeId, id, req.body);
    ok(res, result);
  }),
);

menuRouter.delete(
  '/admin/menus/:id',
  adminAuth,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    await menuService.deleteMenuItem(req.auth!.storeId, id);
    ok(res, null, 204);
  }),
);
