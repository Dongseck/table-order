import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { registerAuthErrorHandler } from '../api/client';
import type { StoreInfo } from '@shared/types/api/auth';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AdminAuthApi {
  status: Status;
  token: string | null;
  store: StoreInfo | null;
  username: string | null;
  login(input: { storeCode: string; username: string; password: string }): Promise<void>;
  logout(): void;
}

const Ctx = createContext<AdminAuthApi | null>(null);

const TOKEN_KEY = 'auth.adminToken';
const META_KEY = 'auth.adminMeta'; // username + store cached for UI

function readMeta(): { store: StoreInfo; username: string } | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as { store: StoreInfo; username: string }) : null;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(META_KEY);
    setToken(null);
    setStore(null);
    setUsername(null);
    setStatus('unauthenticated');
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  // Init: read localStorage once.
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setStatus('unauthenticated');
      return;
    }
    const meta = readMeta();
    setToken(saved);
    if (meta) {
      setStore(meta.store);
      setUsername(meta.username);
    }
    setStatus('authenticated');
  }, []);

  // Register 401 handler.
  useEffect(() => {
    registerAuthErrorHandler((scope) => {
      if (scope === 'admin') logout();
    });
    return () => registerAuthErrorHandler(null);
  }, [logout]);

  const login = useCallback(
    async (input: { storeCode: string; username: string; password: string }) => {
      const res = await authApi.adminLogin(input);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(
        META_KEY,
        JSON.stringify({ store: res.store, username: res.username }),
      );
      setToken(res.token);
      setStore(res.store);
      setUsername(res.username);
      setStatus('authenticated');
      navigate('/admin/dashboard', { replace: true });
    },
    [navigate],
  );

  const value = useMemo<AdminAuthApi>(
    () => ({ status, token, store, username, login, logout }),
    [status, token, store, username, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth(): AdminAuthApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
