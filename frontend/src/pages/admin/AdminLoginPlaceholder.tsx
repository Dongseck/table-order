import { PlaceholderLayout } from '../PlaceholderLayout';

export default function AdminLoginPlaceholder() {
  return (
    <PlaceholderLayout
      unit="Unit 1 (Auth)"
      title="관리자 로그인"
      description="FR-06: storeCode + username + password로 JWT(16h) 발급."
    />
  );
}
