import type { OrderStatus } from '../domain';

export interface CreateOrderRequest {
  items: Array<{
    menuItemId: number;
    quantity: number;
  }>;
  totalAmount: number;
}

export interface CreateOrderResponse {
  order: {
    id: number;
    orderNumber: number;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
  };
}

export interface CustomerOrdersResponse {
  orders: Array<{
    id: number;
    orderNumber: number;
    status: OrderStatus;
    totalAmount: number;
    createdAt: string;
    items: Array<{
      id: number;
      menuItemName: string;
      unitPrice: number;
      quantity: number;
    }>;
  }>;
}

export interface AdminOrdersResponse {
  tables: Array<{
    tableId: number;
    tableNumber: number;
    totalAmount: number;
    orders: Array<{
      id: number;
      orderNumber: number;
      status: OrderStatus;
      totalAmount: number;
      createdAt: string;
      updatedAt: string;
      items: Array<{
        id: number;
        menuItemName: string;
        unitPrice: number;
        quantity: number;
      }>;
    }>;
  }>;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}
