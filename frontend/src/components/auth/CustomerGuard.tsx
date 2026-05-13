import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loading } from '../common';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';

export function CustomerGuard({ children }: { children: ReactNode }) {
  const { status } = useCustomerAuth();
  if (status === 'loading') return <Loading fullscreen message="확인 중..." />;
  if (status === 'unauthenticated') return <Navigate to="/customer/login" replace />;
  return <>{children}</>;
}
