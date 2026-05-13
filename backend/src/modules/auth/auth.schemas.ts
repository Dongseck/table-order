import { z } from 'zod';
import {
  AdminUsernameSchema,
  StoreCodeSchema,
  TableNumberSchema,
} from '../../common/validation';

export const AdminLoginBodySchema = z.object({
  storeCode: StoreCodeSchema,
  username: AdminUsernameSchema,
  password: z.string().min(1).max(100),
});

export const CustomerLoginBodySchema = z.object({
  storeCode: StoreCodeSchema,
  tableNumber: z.coerce.number().pipe(TableNumberSchema),
  password: z.string().min(1).max(20),
});

export type AdminLoginBody = z.infer<typeof AdminLoginBodySchema>;
export type CustomerLoginBody = z.infer<typeof CustomerLoginBodySchema>;
