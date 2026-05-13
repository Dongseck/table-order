import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLoginPage from '../AdminLoginPlaceholder';
import { ToastProvider } from '../../../components/common';

vi.mock('../../../api/auth', () => ({
  authApi: {
    adminLogin: vi.fn(),
    customerLogin: vi.fn(),
    customerMe: vi.fn(),
  },
}));

import { authApi } from '../../../api/auth';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <ToastProvider>
        <AdminLoginPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('AdminLoginPage', () => {
  it('renders the form', () => {
    renderPage();
    expect(screen.getByTestId('admin-login-form')).toBeInTheDocument();
    expect(screen.getByTestId('admin-login-submit')).toBeInTheDocument();
  });

  it('submits and calls authApi.adminLogin', async () => {
    (authApi.adminLogin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      token: 'jwt',
      expiresAt: '2026-05-14T00:00:00+09:00',
      store: { id: 1, code: 'store-demo', name: '데모' },
      username: 'admin',
    });

    renderPage();
    fireEvent.change(screen.getByTestId('admin-login-password'), {
      target: { value: 'Admin1234!' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('admin-login-submit'));
    });

    await waitFor(() => {
      expect(authApi.adminLogin).toHaveBeenCalledWith({
        storeCode: 'store-demo',
        username: 'admin',
        password: 'Admin1234!',
      });
    });
  });
});
