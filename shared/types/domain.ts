// Domain entity types — Foundation defined, shared by backend & frontend.
// Time fields are ISO 8601 strings interpreted as KST (Asia/Seoul, +09:00).

export type OrderStatus = 'PENDING' | 'PREPARING' | 'COMPLETED';

export interface Store {
  id: number;
  code: string;
  name: string;
}

export interface AdminUser {
  id: number;
  storeId: number;
  username: string;
}

export interface Table {
  id: number;
  storeId: number;
  tableNumber: number;
  currentSessionId: number | null;
}

export interface TableSession {
  id: number;
  tableId: number;
  startedAt: string;
  endedAt: string | null;
}

export interface Category {
  id: number;
  storeId: number;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface OrderItem {
  id: number;
  menuItemName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: number;
  sessionId: number;
  tableId: number;
  orderNumber: number;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderHistoryItem {
  id: number;
  menuItemName: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderHistory {
  id: number;
  tableId: number;
  tableNumber: number;
  sessionId: number;
  sessionStartedAt: string;
  sessionEndedAt: string;
  orderNumber: number;
  status: OrderStatus;
  totalAmount: number;
  orderedAt: string;
  archivedAt: string;
  items: OrderHistoryItem[];
}
