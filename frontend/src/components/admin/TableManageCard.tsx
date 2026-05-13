import React from 'react';
import { TableDto } from '../../api/adminTable';
import { Button } from '../common';

interface Props {
  table: TableDto;
  onComplete: (tableId: number) => void;
  onDelete: (tableId: number) => void;
  onShowHistory: (tableId: number) => void;
}

export const TableManageCard: React.FC<Props> = ({ table, onComplete, onDelete, onShowHistory }) => {
  const isActive = table.currentSessionId !== null;

  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: isActive ? '2px solid var(--color-warning, #FFA726)' : '2px solid transparent',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>테이블 {table.tableNumber}</h3>
        <span style={{
          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
          background: isActive ? '#FFF3E0' : '#E8F5E9',
          color: isActive ? '#E65100' : '#2E7D32',
        }}>
          {isActive ? '이용중' : '비어있음'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {isActive && (
          <Button variant="danger" size="small" onClick={() => onComplete(table.id)}>
            이용 완료
          </Button>
        )}
        <Button variant="secondary" size="small" onClick={() => onShowHistory(table.id)}>
          과거 내역
        </Button>
        {!isActive && (
          <Button variant="secondary" size="small" onClick={() => onDelete(table.id)}>
            삭제
          </Button>
        )}
      </div>
    </div>
  );
};
