import { Button } from '../../components/common';

interface FilterState {
  selectedTableIds: number[];
  hideEmptyTables: boolean;
}

interface DashboardFilterProps {
  tables: Array<{ tableId: number; tableNumber: number }>;
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
}

export default function DashboardFilter({ tables, filter, onFilterChange }: DashboardFilterProps) {
  const toggleTable = (tableId: number) => {
    const ids = filter.selectedTableIds.includes(tableId)
      ? filter.selectedTableIds.filter((id) => id !== tableId)
      : [...filter.selectedTableIds, tableId];
    onFilterChange({ ...filter, selectedTableIds: ids });
  };

  const clearFilter = () => {
    onFilterChange({ selectedTableIds: [], hideEmptyTables: false });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
      }}
      data-testid="dashboard-filter"
    >
      {tables.map((t) => (
        <button
          key={t.tableId}
          onClick={() => toggleTable(t.tableId)}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '16px',
            border: '1px solid #ddd',
            background: filter.selectedTableIds.includes(t.tableId) ? '#2563eb' : '#fff',
            color: filter.selectedTableIds.includes(t.tableId) ? '#fff' : '#333',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            minHeight: '32px',
          }}
          data-testid={`filter-table-${t.tableNumber}`}
        >
          {t.tableNumber}번
        </button>
      ))}

      <label
        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: '0.5rem', fontSize: '0.8125rem' }}
      >
        <input
          type="checkbox"
          checked={filter.hideEmptyTables}
          onChange={(e) => onFilterChange({ ...filter, hideEmptyTables: e.target.checked })}
          data-testid="filter-hide-empty"
        />
        빈 테이블 숨기기
      </label>

      {(filter.selectedTableIds.length > 0 || filter.hideEmptyTables) && (
        <Button size="sm" variant="secondary" onClick={clearFilter} data-testid="filter-clear">
          초기화
        </Button>
      )}
    </div>
  );
}
