import { api } from './client';
import type { AdminOrdersResponse, UpdateOrderStatusRequest } from '@shared/types/api/order';
import type { OrderStatus } from '@shared/types/domain';

export const adminOrderApi = {
  getAll(params?: { tableId?: number; status?: string }): Promise<AdminOrdersResponse> {
    return api.get<AdminOrdersResponse>('/admin/orders', { query: params });
  },

  updateStatus(orderId: number, status: OrderStatus): Promise<{ order: unknown }> {
    const body: UpdateOrderStatusRequest = { status };
    return api.patch<{ order: unknown }>(`/admin/orders/${orderId}/status`, { body });
  },

  delete(orderId: number): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/admin/orders/${orderId}`);
  },
};
