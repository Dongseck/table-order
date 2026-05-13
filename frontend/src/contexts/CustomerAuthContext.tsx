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

interface CustomerAuthApi {
  status: Status;
  token: string | null;
  tableId: number | null;
  tableNumber: number | null;
  store: StoreInfo | null;
  login(input: { storeCode: string; tableNumber: number; password: string }): Promise<void>;
  logout(): void;
}

const Ctx = createContext<CustomerAuthApi | null>(null);
const TOKEN_KEY = 'auth.tableToken';

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tableId, setTableId] = useState<number | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setTableId(null);
    setTableNumber(null);
    setStore(null);
    setStatus('unauthenticated');
    navigate('/customer/login', { replace: true });
  }, [navigate]);

  // Init: read token, validate against server.
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setStatus('unauthenticated');
      return;
    }
    setToken(saved);
    authApi
      .customerMe()
      .then((me) => {
        setTableId(me.tableId);
        setTableNumber(me.tableNumber);
        setStore(me.store);
        setStatus('authenticated');
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setStatus('unauthenticated');
      });
  }, []);

  // Register 401 handler.
  useEffect(() => {
    registerAuthErrorHandler((scope) => {
      if (scope === 'table') logout();
    });
    return () => registerAuthErrorHandler(null);
  }, [logout]);

  const login = useCallback(
    async (input: { storeCode: string; tableNumber: number; password: string }) => {
      const res = await authApi.customerLogin(input);
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setTableId(res.tableId);
      setTableNumber(res.tableNumber);
      setStore(res.store);
      setStatus('authenticated');
      navigate('/customer/menu', { replace: true });
    },
    [navigate],
  );

  const value = useMemo<CustomerAuthApi>(
    () => ({ status, token, tableId, tableNumber, store, login, logout }),
    [status, token, tableId, tableNumber, store, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCustomerAuth(): CustomerAuthApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
