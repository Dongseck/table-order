import { useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { orderApi } from '../../api/order';
import { Button, Loading } from '../../components/common';
import type { CustomerOrdersResponse } from '@shared/types/api/order';
import styles from './OrderHistory.module.css';

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기중',
  PREPARING: '준비중',
  COMPLETED: '완료',
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: styles.statusPending,
  PREPARING: styles.statusPreparing,
  COMPLETED: styles.statusCompleted,
};

export default function OrderHistoryPlaceholder() {
  const fetchOrders = useCallback(() => orderApi.getMyOrders(), []);
  const { data, loading, run } = useApi<CustomerOrdersResponse>(fetchOrders);

  if (loading) return <Loading data-testid="order-history-loading" />;

  const orders = data?.orders ?? [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>주문 내역</h1>

      <div className={styles.refreshButton}>
        <Button size="sm" variant="secondary" onClick={run} data-testid="order-history-refresh">
          새로고침
        </Button>
      </div>

      {orders.length === 0 ? (
        <p className={styles.emptyMessage} data-testid="order-history-empty">
          아직 주문 내역이 없습니다.
        </p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className={styles.orderCard} data-testid="order-history-card">
            <div className={styles.orderHeader}>
              <div>
                <span className={styles.orderNumber}>주문 #{order.orderNumber}</span>
                <span className={styles.orderTime}>
                  {' '}{new Date(order.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className={`${styles.statusBadge} ${STATUS_CLASS[order.status] ?? ''}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>

            <ul className={styles.orderItems}>
              {order.items.map((item) => (
                <li key={item.id} className={styles.orderItem}>
                  <span>{item.menuItemName} x{item.quantity}</span>
                  <span>{(item.unitPrice * item.quantity).toLocaleString()}원</span>
                </li>
              ))}
            </ul>

            <div className={styles.orderTotal}>
              {order.totalAmount.toLocaleString()}원
            </div>
          </div>
        ))
      )}
    </div>
  );
}
