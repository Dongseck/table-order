import type { NextFunction, Request, Response } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from './error';
import { ErrorCodes } from './error-codes';

// ── Reusable schemas ──────────────────────────────────────────
export const MenuNameSchema = z.string().min(1).max(50);
export const MenuDescriptionSchema = z.string().max(500).optional().nullable();
export const CategoryNameSchema = z.string().min(1).max(30);
export const StoreNameSchema = z.string().min(1).max(50);
export const StoreCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/);
export const PriceSchema = z
  .number()
  .int()
  .min(100)
  .max(1_000_000)
  .refine((n) => n % 100 === 0, 'PRICE_OUT_OF_RANGE');
export const TableNumberSchema = z.number().int().min(1).max(999);
export const TablePasswordSchema = z.string().regex(/^\d{4,8}$/);
export const AdminUsernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/);
export const AdminPasswordSchema = z
  .string()
  .min(8)
  .regex(/[A-Za-z]/)
  .regex(/[0-9]/);
export const QuantitySchema = z.number().int().min(1).max(99);
export const ImageUrlSchema = z
  .string()
  .max(500)
  .refine((s) => s === '' || /^https?:\/\//.test(s), 'INVALID_IMAGE_URL')
  .optional()
  .nullable();
export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const OrderStatusSchema = z.enum(['PENDING', 'PREPARING', 'COMPLETED']);

// ── Middleware factory ────────────────────────────────────────
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw new AppError(
        ErrorCodes.VALIDATION_FAILED,
        'Validation failed',
        400,
        { fields },
      );
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const fields = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw new AppError(
        ErrorCodes.VALIDATION_FAILED,
        'Validation failed',
        400,
        { fields },
      );
    }
    next();
  };
}
