import { useState } from 'react';
import { Modal, Button, ConfirmDialog } from '../../components/common';
import type { OrderStatus } from '@shared/types/domain';

interface OrderData {
  id: number;
  orderNumber: number;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{ id: number; menuItemName: string; unitPrice: number; quantity: number }>;
}

interface OrderDetailModalProps {
  order: OrderData | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (orderId: number, status: OrderStatus) => void;
  onDelete: (orderId: number) => void;
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['PREPARING'],
  PREPARING: ['COMPLETED', 'PENDING'],
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기중',
  PREPARING: '준비중',
  COMPLETED: '완료',
};

export default function OrderDetailModal({
  order,
  open,
  onClose,
  onStatusChange,
  onDelete,
}: OrderDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!order) return null;

  const nextStatuses = NEXT_STATUS[order.status] ?? [];
  const canDelete = order.status !== 'COMPLETED';

  return (
    <>
      <Modal open={open} onClose={onClose} title={`주문 #${order.orderNumber}`}>
        <div data-testid="order-detail-modal">
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>상태: <strong>{STATUS_LABEL[order.status]}</strong></span>
              <span>{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
              총 {order.totalAmount.toLocaleString()}원
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>메뉴</th>
                <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>수량</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.5rem 0' }}>{item.menuItemName}</td>
                  <td style={{ textAlign: 'center', padding: '0.5rem 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>
                    {(item.unitPrice * item.quantity).toLocaleString()}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {nextStatuses.map((status) => (
              <Button
                key={status}
                variant={status === 'PENDING' ? 'secondary' : 'primary'}
                onClick={() => onStatusChange(order.id, status)}
                data-testid={`order-detail-status-${status.toLowerCase()}`}
              >
                {STATUS_LABEL[status]}(으)로 변경
              </Button>
            ))}
            {canDelete && (
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                data-testid="order-detail-delete"
              >
                삭제
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="주문 삭제"
        message={`주문 #${order.orderNumber}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        danger
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(order.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
