import { Router } from 'express';

/**
 * Unit 4 (Table) owns this router.
 * Routes to be added:
 *   GET    /admin/tables   POST /admin/tables
 *   PATCH  /admin/tables/:id   DELETE /admin/tables/:id
 *   POST   /admin/tables/:id/complete
 *   GET    /admin/tables/:id/history
 */
export const tableRouter = Router();
