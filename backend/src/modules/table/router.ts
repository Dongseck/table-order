import { Router } from 'express';
import { adminAuth } from '../../middlewares/auth';
import { ok } from '../../common/response';
import { AppError } from '../../common/error';
import { ErrorCodes } from '../../common/error-codes';
import * as tableService from './table.service';
import * as tableSessionService from './table-session.service';

export const tableRouter = Router();

// GET /api/v1/admin/tables
tableRouter.get('/admin/tables', adminAuth, async (req, res, next) => {
  try {
    const { storeId } = req.auth as { storeId: number };
    const tables = await tableService.getTablesByStore(storeId);
    ok(res, tables);
  } catch (err) { next(err); }
});

// POST /api/v1/admin/tables
tableRouter.post('/admin/tables', adminAuth, async (req, res, next) => {
  try {
    const { storeId } = req.auth as { storeId: number };
    const { tableNumber, password } = req.body;

    if (typeof tableNumber !== 'number' || tableNumber <= 0) {
      throw new AppError(ErrorCodes.INVALID_TABLE_NUMBER, '테이블 번호는 1 이상의 숫자여야 합니다', 400);
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      throw new AppError(ErrorCodes.INVALID_TABLE_PASSWORD, '비밀번호는 4자 이상이어야 합니다', 400);
    }

    const table = await tableService.createTable(storeId, tableNumber, password);
    ok(res, table, 201);
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/tables/:id
tableRouter.patch('/admin/tables/:id', adminAuth, async (req, res, next) => {
  try {
    const { storeId } = req.auth as { storeId: number };
    const tableId = Number(req.params.id);
    const { tableNumber, password } = req.body;

    if (tableNumber !== undefined && (typeof tableNumber !== 'number' || tableNumber <= 0)) {
      throw new AppError(ErrorCodes.INVALID_TABLE_NUMBER, '테이블 번호는 1 이상의 숫자여야 합니다', 400);
    }
    if (password !== undefined && (typeof password !== 'string' || password.length < 4)) {
      throw new AppError(ErrorCodes.INVALID_TABLE_PASSWORD, '비밀번호는 4자 이상이어야 합니다', 400);
    }

    const table = await tableService.updateTable(tableId, storeId, { tableNumber, password });
    ok(res, table);
  } catch (err) { next(err); }
});

// DELETE /api/v1/admin/tables/:id
tableRouter.delete('/admin/tables/:id', adminAuth, async (req, res, next) => {
  try {
    const { storeId } = req.auth as { storeId: number };
    const tableId = Number(req.params.id);
    await tableService.deleteTable(tableId, storeId);
    ok(res, null);
  } catch (err) { next(err); }
});

// POST /api/v1/admin/tables/:id/complete
tableRouter.post('/admin/tables/:id/complete', adminAuth, async (req, res, next) => {
  try {
    const { storeId } = req.auth as { storeId: number };
    const tableId = Number(req.params.id);
    const result = await tableSessionService.completeSession(tableId, storeId);
    ok(res, result);
  } catch (err) { next(err); }
});

// GET /api/v1/admin/tables/:id/history
tableRouter.get('/admin/tables/:id/history', adminAuth, async (req, res, next) => {
  try {
    const { storeId } = req.auth as { storeId: number };
    const tableId = Number(req.params.id);
    const date = req.query.date as string | undefined;

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError(ErrorCodes.INVALID_DATE_FORMAT, '날짜 형식은 YYYY-MM-DD여야 합니다', 400);
    }

    const history = await tableSessionService.getSessionHistory(tableId, storeId, date);
    ok(res, history);
  } catch (err) { next(err); }
});
