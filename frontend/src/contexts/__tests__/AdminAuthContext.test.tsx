import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '../AdminAuthContext';

vi.mock('../../api/auth', () => ({
  authApi: {
    adminLogin: vi.fn(),
    customerLogin: vi.fn(),
    customerMe: vi.fn(),
  },
}));

import { authApi } from '../../api/auth';

function Probe() {
  const { status, username, login, logout } = useAdminAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="username">{username ?? ''}</span>
      <button
        data-testid="do-login"
        onClick={() => login({ storeCode: 'store-demo', username: 'admin', password: 'pw' })}
      >
        login
      </button>
      <button data-testid="do-logout" onClick={logout}>
        logout
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AdminAuthContext', () => {
  it('starts unauthenticated when no token in storage', () => {
    render(
      <MemoryRouter>
        <AdminAuthProvider>
          <Probe />
        </AdminAuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
  });

  it('login() stores token and flips status', async () => {
    (authApi.adminLogin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      token: 'jwt-token',
      expiresAt: '2026-05-14T00:00:00+09:00',
      store: { id: 1, code: 'store-demo', name: '데모' },
      username: 'admin',
    });

    render(
      <MemoryRouter>
        <AdminAuthProvider>
          <Probe />
        </AdminAuthProvider>
      </MemoryRouter>,
    );

    await act(async () => {
      screen.getByTestId('do-login').click();
    });

    expect(screen.getByTestId('status').textContent).toBe('authenticated');
    expect(screen.getByTestId('username').textContent).toBe('admin');
    expect(localStorage.getItem('auth.adminToken')).toBe('jwt-token');
  });

  it('logout() clears state and storage', async () => {
    localStorage.setItem('auth.adminToken', 'old-jwt');
    localStorage.setItem(
      'auth.adminMeta',
      JSON.stringify({ store: { id: 1, code: 'x', name: 'x' }, username: 'admin' }),
    );

    render(
      <MemoryRouter>
        <AdminAuthProvider>
          <Probe />
        </AdminAuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('status').textContent).toBe('authenticated');

    await act(async () => {
      screen.getByTestId('do-logout').click();
    });

    expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    expect(localStorage.getItem('auth.adminToken')).toBeNull();
  });
});
