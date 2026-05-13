import { useCallback, useEffect, useState } from 'react';
import { adminOrderApi } from '../../api/adminOrder';
import { useEventSource } from '../../hooks/useEventSource';
import { Button, Loading } from '../../components/common';
import DashboardFilter from '../../components/admin/DashboardFilter';
import TableCard from '../../components/admin/TableCard';
import OrderDetailModal from '../../components/admin/OrderDetailModal';
import type { AdminOrdersResponse } from '@shared/types/api/order';
import type { SseEvent } from '@shared/types/events';
import type { OrderStatus } from '@shared/types/domain';
import styles from './Dashboard.module.css';

type TableData = AdminOrdersResponse['tables'][number];
type OrderData = TableData['orders'][number];

export default function DashboardPlaceholder() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [filter, setFilter] = useState<{ selectedTableIds: number[]; hideEmptyTables: boolean }>({
    selectedTableIds: [],
    hideEmptyTables: false,
  });

  const token = localStorage.getItem('auth.adminToken') ?? '';

  const loadOrders = useCallback(async () => {
    try {
      const data = await adminOrderApi.getAll();
      setTables(data.tables);
    } catch {
      // handled by UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleSseEvent = useCallback((event: SseEvent) => {
    setTables((prev) => {
      switch (event.type) {
        case 'order:new': {
          const { tableId, orderId, orderNumber, totalAmount, items, createdAt } = event.data;
          return prev.map((t) => {
            if (t.tableId !== tableId) return t;
            const newOrder: OrderData = {
              id: orderId,
              orderNumber,
              status: 'PENDING' as OrderStatus,
              totalAmount,
              createdAt,
              updatedAt: createdAt,
              items: items.map((i, idx) => ({ id: -(idx + 1), ...i })),
            };
            return {
              ...t,
              totalAmount: t.totalAmount + totalAmount,
              orders: [newOrder, ...t.orders],
            };
          });
        }
        case 'order:status': {
          const { orderId, status } = event.data;
          return prev.map((t) => ({
            ...t,
            orders: t.orders.map((o) =>
              o.id === orderId ? { ...o, status: status as OrderStatus, updatedAt: new Date().toISOString() } : o,
            ),
          }));
        }
        case 'order:deleted': {
          const { orderId, tableId } = event.data;
          return prev.map((t) => {
            if (t.tableId !== tableId) return t;
            const deletedOrder = t.orders.find((o) => o.id === orderId);
            return {
              ...t,
              totalAmount: t.totalAmount - (deletedOrder?.totalAmount ?? 0),
              orders: t.orders.filter((o) => o.id !== orderId),
            };
          });
        }
        case 'table:completed': {
          const { tableId } = event.data;
          return prev.map((t) =>
            t.tableId === tableId ? { ...t, totalAmount: 0, orders: [] } : t,
          );
        }
        default:
          return prev;
      }
    });
  }, []);

  const { status: sseStatus, reconnect } = useEventSource({
    url: '/api/v1/admin/sse/orders',
    token,
    onEvent: handleSseEvent,
    enabled: !!token,
  });

  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    try {
      await adminOrderApi.updateStatus(orderId, status);
    } catch {
      // SSE will sync state
    }
  };

  const handleDelete = async (orderId: number) => {
    try {
      await adminOrderApi.delete(orderId);
      setSelectedOrder(null);
    } catch {
      // SSE will sync state
    }
  };

  const filteredTables = tables.filter((t) => {
    if (filter.selectedTableIds.length > 0 && !filter.selectedTableIds.includes(t.tableId)) return false;
    if (filter.hideEmptyTables && t.orders.length === 0) return false;
    return true;
  });

  if (isLoading) return <Loading fullscreen data-testid="dashboard-loading" />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>주문 대시보드</h1>
        <div className={styles.sseStatus}>
          <span
            className={`${styles.statusDot} ${
              sseStatus === 'connected'
                ? styles.statusConnected
                : sseStatus === 'failed'
                  ? styles.statusFailed
                  : styles.statusDisconnected
            }`}
          />
          <span>
            {sseStatus === 'connected' ? '실시간 연결됨' : sseStatus === 'failed' ? '연결 실패' : '연결 중...'}
          </span>
        </div>
      </div>

      {sseStatus === 'failed' && (
        <div className={styles.reconnectBanner} data-testid="dashboard-reconnect-banner">
          <span>실시간 연결이 끊어졌습니다.</span>
          <Button size="sm" onClick={() => { reconnect(); void loadOrders(); }} data-testid="dashboard-reconnect">
            재연결
          </Button>
        </div>
      )}

      <DashboardFilter
        tables={tables.map((t) => ({ tableId: t.tableId, tableNumber: t.tableNumber }))}
        filter={filter}
        onFilterChange={setFilter}
      />

      <div className={styles.grid} data-testid="dashboard-grid">
        {filteredTables.length === 0 ? (
          <p className={styles.emptyMessage}>표시할 테이블이 없습니다.</p>
        ) : (
          filteredTables.map((t) => (
            <TableCard
              key={t.tableId}
              tableId={t.tableId}
              tableNumber={t.tableNumber}
              totalAmount={t.totalAmount}
              orders={t.orders}
              onOrderClick={setSelectedOrder}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      <OrderDetailModal
        order={selectedOrder}
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
