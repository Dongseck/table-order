import React, { useState, useEffect } from 'react';
import { adminTableApi, TableDto } from '../../api/adminTable';
import { TableManageCard } from '../../components/admin/TableManageCard';
import { OrderHistoryModal } from '../../components/admin/OrderHistoryModal';
import { Button, Loading, Modal, ConfirmDialog } from '../../components/common';

export const TableManagePage: React.FC = () => {
  const [tables, setTables] = useState<TableDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ tableNumber: '', password: '' });
  const [createError, setCreateError] = useState('');
  const [historyTarget, setHistoryTarget] = useState<{ id: number; number: number } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'complete' | 'delete'; tableId: number } | null>(null);

  useEffect(() => { loadTables(); }, []);

  async function loadTables() {
    setLoading(true);
    try {
      const data = await adminTableApi.getTables();
      setTables(data);
    } catch {
      setTables([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    try {
      await adminTableApi.createTable({
        tableNumber: Number(createForm.tableNumber),
        password: createForm.password,
      });
      setShowCreateForm(false);
      setCreateForm({ tableNumber: '', password: '' });
      loadTables();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : '생성 실패');
    }
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'complete') {
        await adminTableApi.completeSession(confirmAction.tableId);
      } else {
        await adminTableApi.deleteTable(confirmAction.tableId);
      }
      loadTables();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '처리 실패');
    } finally {
      setConfirmAction(null);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>테이블 관리</h1>
        <Button variant="primary" onClick={() => setShowCreateForm(true)}>테이블 추가</Button>
      </div>

      {loading ? (
        <Loading />
      ) : tables.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>등록된 테이블이 없습니다</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {tables.map((table) => (
            <TableManageCard
              key={table.id}
              table={table}
              onComplete={(id) => setConfirmAction({ type: 'complete', tableId: id })}
              onDelete={(id) => setConfirmAction({ type: 'delete', tableId: id })}
              onShowHistory={(id) => {
                const t = tables.find((x) => x.id === id);
                if (t) setHistoryTarget({ id, number: t.tableNumber });
              }}
            />
          ))}
        </div>
      )}

      {/* 생성 모달 */}
      {showCreateForm && (
        <Modal open={showCreateForm} onClose={() => setShowCreateForm(false)} title="테이블 추가">
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>테이블 번호</label>
              <input
                type="number" min="1" required
                value={createForm.tableNumber}
                onChange={(e) => setCreateForm({ ...createForm, tableNumber: e.target.value })}
                style={{ display: 'block', width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>비밀번호 (4자 이상)</label>
              <input
                type="password" minLength={4} required
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                style={{ display: 'block', width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, marginTop: 4 }}
              />
            </div>
            {createError && <p style={{ color: '#e53935', fontSize: 13 }}>{createError}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowCreateForm(false)}>취소</Button>
              <Button variant="primary" type="submit">생성</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 확인 다이얼로그 */}
      {confirmAction && (
        <ConfirmDialog
          open={true}
          title={confirmAction.type === 'complete' ? '이용 완료' : '테이블 삭제'}
          message={
            confirmAction.type === 'complete'
              ? '이용 완료 처리하시겠습니까?\n모든 주문이 과거 내역으로 이동됩니다.'
              : '이 테이블을 삭제하시겠습니까?'
          }
          confirmLabel={confirmAction.type === 'complete' ? '완료 처리' : '삭제'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* 과거 내역 모달 */}
      {historyTarget && (
        <OrderHistoryModal
          tableId={historyTarget.id}
          tableNumber={historyTarget.number}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
};
