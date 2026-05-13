import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loading } from '../common';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { status } = useAdminAuth();
  if (status === 'loading') return <Loading fullscreen message="확인 중..." />;
  if (status === 'unauthenticated') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
