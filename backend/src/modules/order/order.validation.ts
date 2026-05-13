import { z } from 'zod';
import { QuantitySchema, OrderStatusSchema } from '../../common/validation';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive(),
        quantity: QuantitySchema,
      }),
    )
    .min(1, 'ORDER_EMPTY')
    .max(50, 'ORDER_ITEMS_OUT_OF_RANGE')
    .refine(
      (items) => {
        const ids = items.map((i) => i.menuItemId);
        return new Set(ids).size === ids.length;
      },
      { message: 'Duplicate menuItemId not allowed' },
    ),
  totalAmount: z.number().int().min(0),
});

export const updateStatusSchema = z.object({
  status: OrderStatusSchema,
});

export const adminOrdersQuerySchema = z.object({
  tableId: z.coerce.number().int().positive().optional(),
  status: OrderStatusSchema.optional(),
});
