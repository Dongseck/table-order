import { Button } from '../common';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import styles from './AdminHeader.module.css';

interface Props {
  title: string;
}

export function AdminHeader({ title }: Props) {
  const { username, store, logout } = useAdminAuth();
  return (
    <header className={styles.header} data-testid="admin-header">
      <div className={styles.titles}>
        <h2 className={styles.title}>{title}</h2>
        <small className={styles.meta}>
          {store?.name ?? ''} {username ? `· ${username}` : ''}
        </small>
      </div>
      <Button variant="secondary" size="sm" onClick={logout} data-testid="admin-logout">
        로그아웃
      </Button>
    </header>
  );
}
