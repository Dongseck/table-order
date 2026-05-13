import React, { useEffect, useState } from 'react';
import { adminTableApi, OrderHistorySessionDto } from '../../api/adminTable';
import { Modal, Button, Loading } from '../common';

interface Props {
  tableId: number;
  tableNumber: number;
  onClose: () => void;
}

export const OrderHistoryModal: React.FC<Props> = ({ tableId, tableNumber, onClose }) => {
  const [history, setHistory] = useState<OrderHistorySessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadHistory();
  }, [tableId, dateFilter]);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await adminTableApi.getHistory(tableId, dateFilter || undefined);
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={true} onClose={onClose} title={`테이블 ${tableNumber} - 과거 주문 내역`}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }}
        />
        {dateFilter && (
          <Button variant="secondary" size="sm" onClick={() => setDateFilter('')}>
            초기화
          </Button>
        )}
      </div>

      {loading ? (
        <Loading />
      ) : history.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999', padding: 24 }}>과거 내역이 없습니다</p>
      ) : (
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {history.map((session) => (
            <div key={session.sessionId} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#666' }}>
                  이용완료: {new Date(session.endedAt).toLocaleString('ko-KR')}
                </span>
                <span style={{ fontWeight: 700 }}>
                  {session.totalAmount.toLocaleString()}원
                </span>
              </div>
              {session.orders.map((order) => (
                <div key={order.id} style={{ paddingLeft: 8, marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>#{order.orderNumber}</span>
                  {' - '}
                  {order.items.map((item, idx) => (
                    <span key={idx}>
                      {item.menuItemName} x{item.quantity}
                      {idx < order.items.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  <span style={{ color: '#666' }}> ({order.totalAmount.toLocaleString()}원)</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
