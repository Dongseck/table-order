import { api } from './client';

export interface TableDto {
  id: number;
  storeId: number;
  tableNumber: number;
  currentSessionId: number | null;
  createdAt: string;
}

export interface OrderHistorySessionDto {
  sessionId: number;
  startedAt: string;
  endedAt: string;
  totalAmount: number;
  orders: OrderHistoryOrderDto[];
}

export interface OrderHistoryOrderDto {
  id: number;
  orderNumber: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: { menuItemName: string; quantity: number; unitPrice: number }[];
}

export interface CompleteResultDto {
  archivedOrders: number;
}

export const adminTableApi = {
  getTables() {
    return api.get<TableDto[]>('/admin/tables');
  },

  createTable(data: { tableNumber: number; password: string }) {
    return api.post<TableDto>('/admin/tables', { body: data });
  },

  updateTable(tableId: number, data: { tableNumber?: number; password?: string }) {
    return api.patch<TableDto>(`/admin/tables/${tableId}`, { body: data });
  },

  deleteTable(tableId: number) {
    return api.delete<null>(`/admin/tables/${tableId}`);
  },

  completeSession(tableId: number) {
    return api.post<CompleteResultDto>(`/admin/tables/${tableId}/complete`, { body: {} });
  },

  getHistory(tableId: number, date?: string) {
    return api.get<OrderHistorySessionDto[]>(`/admin/tables/${tableId}/history`, {
      query: date ? { date } : undefined,
    });
  },
};
