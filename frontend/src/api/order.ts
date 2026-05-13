import { api } from './client';
import type { CreateOrderRequest, CreateOrderResponse, CustomerOrdersResponse } from '@shared/types/api/order';

export const orderApi = {
  create(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    return api.post<CreateOrderResponse>('/customer/orders', { body: data });
  },

  getMyOrders(): Promise<CustomerOrdersResponse> {
    return api.get<CustomerOrdersResponse>('/customer/orders');
  },
};
