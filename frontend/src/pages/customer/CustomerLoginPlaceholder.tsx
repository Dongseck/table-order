import { PlaceholderLayout } from '../PlaceholderLayout';

export default function CustomerLoginPlaceholder() {
  return (
    <PlaceholderLayout
      unit="Unit 1 (Auth)"
      title="고객 로그인 / 자동 로그인"
      description="FR-01: 테이블 태블릿이 storeCode + tableNumber + password로 인증하고 토큰을 localStorage에 저장합니다."
    />
  );
}
