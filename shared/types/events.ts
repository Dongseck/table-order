// SSE event types — Foundation stub, Unit 3 completes payload shapes.

export type SseEvent =
  | {
      type: 'order:new';
      data: {
        orderId: number;
        tableId: number;
        tableNumber: number;
        orderNumber: number;
        totalAmount: number;
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
