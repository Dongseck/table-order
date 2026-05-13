import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Button, Input, useToast } from '../../components/common';
import { ApiError } from '../../api/client';
import { humanMessage } from '../../lib/humanMessage';
import {
  AdminAuthProvider,
  useAdminAuth,
} from '../../contexts/AdminAuthContext';
import styles from './AdminLogin.module.css';

function AdminLoginForm() {
  const { status, login } = useAdminAuth();
  const toast = useToast();
  const [storeCode, setStoreCode] = useState('store-demo');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldownSec, setCooldownSec] = useState<number | null>(null);

  useEffect(() => {
    if (cooldownSec === null) return;
    if (cooldownSec <= 0) {
      setCooldownSec(null);
      return;
    }
    const t = setTimeout(() => setCooldownSec((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [cooldownSec]);

  if (status === 'authenticated') return <Navigate to="/admin/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (cooldownSec !== null) return;
    setSubmitting(true);
    try {
      await login({ storeCode, username, password });
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'AUTH_TOO_MANY_ATTEMPTS') {
        setCooldownSec(60);
      }
      toast.error(humanMessage(err.code, err.message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <form
        className={styles.card}
        onSubmit={handleSubmit}
        data-testid="admin-login-form"
        noValidate
      >
        <h1 className={styles.title}>관리자 로그인</h1>
        <p className={styles.subtitle}>매장 대시보드에 로그인합니다.</p>

        <Input
          label="매장 코드"
          name="storeCode"
          value={storeCode}
          onChange={(e) => setStoreCode(e.target.value)}
          autoComplete="organization"
          required
          data-testid="admin-login-storeCode"
        />
        <Input
          label="아이디"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          data-testid="admin-login-username"
        />
        <Input
          label="비밀번호"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          data-testid="admin-login-password"
        />

        <div className={styles.actions}>
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            disabled={cooldownSec !== null}
            data-testid="admin-login-submit"
          >
            {cooldownSec !== null ? `잠시 후 다시 시도 (${cooldownSec}초)` : '로그인'}
          </Button>
        </div>

        <p className={styles.hint}>
          기본 계정: <code>admin</code> / <code>Admin1234!</code>
        </p>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <AdminAuthProvider>
      <AdminLoginForm />
    </AdminAuthProvider>
  );
}
