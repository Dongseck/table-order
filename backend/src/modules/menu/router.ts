import { Router } from 'express';

/**
 * Unit 2 (Menu) owns this router.
 * Routes to be added:
 *   GET    /customer/menus
 *   GET    /admin/categories   POST  /admin/categories
 *   PATCH  /admin/categories/:id   DELETE /admin/categories/:id
 *   PATCH  /admin/categories/reorder
 *   GET    /admin/menus   POST  /admin/menus
 *   PATCH  /admin/menus/:id   DELETE /admin/menus/:id
 *   PATCH  /admin/menus/reorder
 */
export const menuRouter = Router();
