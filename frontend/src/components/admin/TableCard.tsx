import { useEffect, useRef, useState } from 'react';
import type { OrderStatus } from '@shared/types/domain';
import styles from './TableCard.module.css';

interface OrderData {
  id: number;
  orderNumber: number;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{ id: number; menuItemName: string; unitPrice: number; quantity: number }>;
}

interface TableCardProps {
  tableId: number;
  tableNumber: number;
  totalAmount: number;
  orders: OrderData[];
  onOrderClick: (order: OrderData) => void;
  onStatusChange: (orderId: number, status: OrderStatus) => void;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기',
  PREPARING: '준비중',
  COMPLETED: '완료',
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: styles.statusPending,
  PREPARING: styles.statusPreparing,
  COMPLETED: styles.statusCompleted,
};

export default function TableCard({
  tableNumber,
  totalAmount,
  orders,
  onOrderClick,
}: TableCardProps) {
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set());
  const prevOrderIdsRef = useRef<Set<number>>(new Set(orders.map((o) => o.id)));

  useEffect(() => {
    const prevIds = prevOrderIdsRef.current;
    const currentIds = new Set(orders.map((o) => o.id));
    const added = orders.filter((o) => !prevIds.has(o.id));

    if (added.length > 0) {
      setNewOrderIds((prev) => {
        const next = new Set(prev);
        added.forEach((o) => next.add(o.id));
        return next;
      });

      const timer = setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          added.forEach((o) => next.delete(o.id));
          return next;
        });
      }, 5000);

      prevOrderIdsRef.current = currentIds;
      return () => clearTimeout(timer);
    }

    prevOrderIdsRef.current = currentIds;
  }, [orders]);

  return (
    <div className={styles.card} data-testid={`table-card-${tableNumber}`}>
      <div className={styles.header}>
        <span className={styles.tableNumber}>테이블 {tableNumber}</span>
        <span className={styles.totalAmount}>{totalAmount.toLocaleString()}원</span>
      </div>

      <div className={styles.orderList}>
        {orders.length === 0 ? (
          <div className={styles.emptyCard}>주문 없음</div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className={styles.orderRow}
              onClick={() => onOrderClick(order)}
              data-testid={`order-row-${order.id}`}
            >
              <div className={styles.orderInfo}>
                <span className={styles.orderNumberText}>#{order.orderNumber}</span>
                {newOrderIds.has(order.id) && (
                  <span className={styles.newBadge} data-testid={`order-new-badge-${order.id}`}>
                    NEW
                  </span>
                )}
                <span className={`${styles.statusBadge} ${STATUS_CLASS[order.status] ?? ''}`}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
              <span className={styles.orderAmount}>{order.totalAmount.toLocaleString()}원</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
