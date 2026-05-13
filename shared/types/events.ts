export type SseEventType = 'order:new' | 'order:status' | 'order:deleted' | 'table:completed';

export type SseEvent =
  | {
      type: 'order:new';
      data: {
        orderId: number;
        tableId: number;
        tableNumber: number;
        orderNumber: number;
        totalAmount: number;
        items: Array<{ menuItemName: string; unitPrice: number; quantity: number }>;
        createdAt: string;
      };
    }
  | {
      type: 'order:status';
      data: { orderId: number; status: string };
    }
  | {
      type: 'order:deleted';
      data: { orderId: number; tableId: number };
    }
  | {
      type: 'table:completed';
      data: { tableId: number };
    };
