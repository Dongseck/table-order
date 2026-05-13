import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ padding: 32, textAlign: 'center' }} data-testid="not-found">
      <h1 style={{ fontSize: 48, fontWeight: 800 }}>404</h1>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>요청하신 페이지를 찾을 수 없습니다.</p>
      <Link to="/customer/menu" style={{ color: '#2563eb' }}>
        메뉴로 이동
      </Link>
    </div>
  );
}
