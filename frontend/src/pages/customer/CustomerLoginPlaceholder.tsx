import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Button, Input, Loading, useToast } from '../../components/common';
import { ApiError } from '../../api/client';
import { humanMessage } from '../../lib/humanMessage';
import {
  CustomerAuthProvider,
  useCustomerAuth,
} from '../../contexts/CustomerAuthContext';
import styles from './CustomerLogin.module.css';

function CustomerLoginForm() {
  const { status, login } = useCustomerAuth();
  const toast = useToast();
  const [storeCode, setStoreCode] = useState('store-demo');
  const [tableNumber, setTableNumber] = useState<string>('1');
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

  if (status === 'loading') return <Loading fullscreen message="자동 로그인 확인 중..." />;
  if (status === 'authenticated') return <Navigate to="/customer/menu" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (cooldownSec !== null) return;
    setSubmitting(true);
    try {
      const num = parseInt(tableNumber, 10);
      if (!Number.isInteger(num) || num < 1 || num > 999) {
        toast.error('테이블 번호는 1~999 사이의 정수입니다');
        return;
      }
      await login({ storeCode, tableNumber: num, password });
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
        data-testid="customer-login-form"
        noValidate
      >
        <h1 className={styles.title}>테이블 로그인</h1>
        <p className={styles.subtitle}>
          최초 1회 입력 후 다음부터는 자동으로 로그인됩니다.
        </p>

        <Input
          label="매장 코드"
          name="storeCode"
          value={storeCode}
          onChange={(e) => setStoreCode(e.target.value)}
          required
          data-testid="customer-login-storeCode"
        />
        <Input
          label="테이블 번호"
          name="tableNumber"
          type="number"
          inputMode="numeric"
          min={1}
          max={999}
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          required
          data-testid="customer-login-tableNumber"
        />
        <Input
          label="비밀번호"
          name="password"
          type="password"
          inputMode="numeric"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="4~8자리 숫자"
          required
          data-testid="customer-login-password"
        />

        <div className={styles.actions}>
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            disabled={cooldownSec !== null}
            data-testid="customer-login-submit"
          >
            {cooldownSec !== null ? `잠시 후 다시 시도 (${cooldownSec}초)` : '로그인'}
          </Button>
        </div>

        <p className={styles.hint}>
          시연 계정: 테이블 1~10 / 비밀번호 <code>0000</code>
        </p>
      </form>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <CustomerAuthProvider>
      <CustomerLoginForm />
    </CustomerAuthProvider>
  );
}
