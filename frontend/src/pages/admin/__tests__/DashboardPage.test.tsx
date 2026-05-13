import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPlaceholder from '../DashboardPlaceholder';

// Mock the admin order API
vi.mock('../../../api/adminOrder', () => ({
  adminOrderApi: {
    getAll: vi.fn().mockResolvedValue({
      tables: [
        {
          tableId: 1,
          tableNumber: 1,
          totalAmount: 9000,
          orders: [
            {
              id: 1,
              orderNumber: 1,
              status: 'PENDING',
              totalAmount: 9000,
              createdAt: '2026-05-13T12:00:00+09:00',
              updatedAt: '2026-05-13T12:00:00+09:00',
              items: [{ id: 1, menuItemName: '김치찌개', unitPrice: 9000, quantity: 1 }],
            },
          ],
        },
      ],
    }),
    updateStatus: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

// Mock EventSource
class MockEventSource {
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  addEventListener = vi.fn();
}

Object.defineProperty(window, 'EventSource', { value: MockEventSource });

function renderPage() {
  localStorage.setItem('auth.adminToken', 'test-token');
  return render(
    <MemoryRouter>
      <DashboardPlaceholder />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  it('shows loading initially then renders grid', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });
  });

  it('renders table card with order data', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('table-card-1')).toBeInTheDocument();
    });
    expect(screen.getAllByText('9,000원').length).toBeGreaterThanOrEqual(1);
  });
});
