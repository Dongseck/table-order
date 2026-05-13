# Unit 1 (Auth) — Frontend Components

> Unit 1의 React 컴포넌트, Context, hook 명세. App.tsx는 수정하지 않음.

---

## 1. 컴포넌트 트리

```
App (Foundation 소유, 수정 안 함)
├── ToastProvider (Foundation)
└── BrowserRouter
    └── Routes
        ├── /admin/login → AdminLoginPage         (← Unit 1, Login은 Provider/Guard 불필요)
        ├── /admin/dashboard → DashboardPlaceholder (← Unit 3)
        │       └── (Unit 3가 자기 페이지에서 <AdminAuthProvider><AdminGuard>...</AdminGuard></AdminAuthProvider> wrap)
        ├── /customer/login → CustomerLoginPage   (← Unit 1)
        └── /customer/menu → CustomerMenuPlaceholder (← Unit 2)
                └── (Unit 2가 자기 페이지에서 <CustomerAuthProvider><CustomerGuard>...</CustomerGuard></CustomerAuthProvider> wrap)
```

> **App.tsx 수정 없음**. AuthContext Provider와 Guard 컴포넌트는 페이지 컴포넌트 내부에서 사용.

---

## 2. AuthContext

### 2.1 `AdminAuthContext`

```ts
// frontend/src/contexts/AdminAuthContext.tsx
interface AdminAuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  token: string | null;
  store: { id: number; code: string; name: string } | null;
  username: string | null;
}

interface AdminAuthApi extends AdminAuthState {
  login(input: { storeCode: string; username: string; password: string }): Promise<void>;  // throws ApiError
  logout(): void;
}

<AdminAuthProvider>
  - useEffect on mount:
    - token = localStorage.getItem('auth.adminToken')
    - 없음 → status='unauthenticated'
    - 있음 → status='authenticated' (검증 endpoint 없음 — JWT 자체 만료에 의존)
       - 만료된 토큰은 다음 API 호출에서 401 → onAuthError로 자동 로그아웃 처리
  - login(): POST /admin/auth/login → setState, localStorage.set, navigate('/admin/dashboard')
  - logout(): localStorage.remove, setState unauthenticated, navigate('/admin/login')
```

**Hook**: `useAdminAuth()` → throws if outside Provider.

### 2.2 `CustomerAuthContext`

```ts
interface CustomerAuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  token: string | null;
  tableId: number | null;
  tableNumber: number | null;
  store: { id: number; code: string; name: string } | null;
}

interface CustomerAuthApi extends CustomerAuthState {
  login(input: { storeCode: string; tableNumber: number; password: string }): Promise<void>;
  logout(): void;  // 내부 전용 (UI 미노출)
}

<CustomerAuthProvider>
  - useEffect on mount:
    - token = localStorage.getItem('auth.tableToken')
    - 없음 → status='unauthenticated'
    - 있음 → GET /customer/auth/me (자동 로그인 검증)
       - 200 → status='authenticated' + table/store info
       - 401 → logout()
  - login(): POST /customer/auth/login → setState + localStorage + navigate('/customer/menu')
  - logout(): localStorage.remove, setState unauthenticated, navigate('/customer/login')
```

**Hook**: `useCustomerAuth()`.

---

## 3. 401 자동 처리 메커니즘

### `api/client.ts`에 onAuthError 등록 (Unit 1이 client.ts에 작은 패치 추가)

> **client.ts는 Foundation 소유**이지만 Unit 1의 핵심 책임 영역. 호환성을 위해 minimal patch:
>
> ```ts
> // Foundation client.ts에 추가
> type AuthErrorHandler = (scope: 'admin' | 'table') => void;
> let onAuthError: AuthErrorHandler | null = null;
> export function registerAuthErrorHandler(h: AuthErrorHandler) { onAuthError = h; }
> ```
>
> 그리고 request() 함수의 ApiError throw 직전에:
> ```ts
> if (!json.success && (json.error.code === 'AUTH_TOKEN_EXPIRED' || json.error.code === 'AUTH_TOKEN_INVALID')) {
>   const scope = path.includes('admin') ? 'admin' : 'table';
>   onAuthError?.(scope);
> }
> ```

각 AuthContext의 Provider가 mount 시 `registerAuthErrorHandler(scope => { if (scope === 'admin') adminLogout(); else tableLogout(); })`로 등록.

> 이 변경은 Foundation client.ts에 ~10줄 추가. Unit 2/3/4의 사용 방식은 영향 없음 (`api.get/post`는 동일).

---

## 4. Guard 컴포넌트

### 4.1 `AdminGuard`
```tsx
function AdminGuard({ children }: { children: ReactNode }) {
  const { status } = useAdminAuth();
  if (status === 'loading') return <Loading fullscreen />;
  if (status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
```

### 4.2 `CustomerGuard`
```tsx
function CustomerGuard({ children }: { children: ReactNode }) {
  const { status } = useCustomerAuth();
  if (status === 'loading') return <Loading fullscreen />;
  if (status === 'unauthenticated') {
    return <Navigate to="/customer/login" replace />;
  }
  return <>{children}</>;
}
```

**Unit 2/3/4 사용 예** (자기 페이지 컴포넌트에서):
```tsx
export default function DashboardPage() {
  return (
    <AdminAuthProvider>
      <AdminGuard>
        <DashboardContent />
      </AdminGuard>
    </AdminAuthProvider>
  );
}
```

> AdminAuthProvider/CustomerAuthProvider는 각 페이지가 wrap. 여러 admin 페이지가 자기들끼리 별도 Provider를 가지지만, **localStorage가 single source of truth**이므로 동작 일관됨.
> 더 효율적으로 하려면 향후 통합 시 App.tsx에 옮길 수 있음 (워크숍 MVP에서는 분산이 cross-unit 충돌 0).

---

## 5. AdminLoginPage

### Props
없음 (라우트 페이지).

### State
- `storeCode`, `username`, `password` (controlled input)
- `submitting: boolean`
- `cooldownSec: number | null` (rate-limit 카운트다운)

### Render
```
<AdminAuthProvider>
  <div container>
    <h1>관리자 로그인</h1>
    <Input label="매장 코드" value={storeCode} placeholder="store-demo" />
    <Input label="아이디" value={username} placeholder="admin" />
    <Input type="password" label="비밀번호" value={password} />
    <Button loading={submitting} disabled={cooldownSec !== null} onClick={handleSubmit}>
      {cooldownSec ? `잠시 후 (${cooldownSec}초)` : '로그인'}
    </Button>
  </div>
</AdminAuthProvider>
```

### onSubmit
```
try {
  setSubmitting(true);
  await adminAuth.login({ storeCode, username, password });
  // login 내부에서 navigate('/admin/dashboard')
} catch (e: ApiError) {
  if (e.code === 'AUTH_TOO_MANY_ATTEMPTS') {
    setCooldownSec(60);
    startCountdown();  // setInterval로 60→0
  }
  toast.error(humanMessage(e.code));
} finally { setSubmitting(false); }
```

### data-testid
`admin-login-form`, `admin-login-storeCode`, `admin-login-username`, `admin-login-password`, `admin-login-submit`

---

## 6. CustomerLoginPage

### State / Render
AdminLoginPage와 유사. `tableNumber`는 number input (1~999).

```
<CustomerAuthProvider>
  <div container>
    <h1>테이블 로그인 (최초 1회)</h1>
    <Input label="매장 코드" placeholder="store-demo" />
    <Input type="number" min={1} max={999} label="테이블 번호" />
    <Input type="password" label="비밀번호" placeholder="4~8자리 숫자" />
    <Button loading={submitting} disabled={cooldownSec !== null}>로그인</Button>
    <p style={hint}>입력한 정보는 토큰으로 저장되어 다음부터 자동 로그인됩니다.</p>
  </div>
</CustomerAuthProvider>
```

### onSubmit
AdminLoginPage와 동일 패턴. 성공 시 `/customer/menu` 리다이렉트.

### 자동 로그인 흐름
LoginPage 자체 mount 시점:
- CustomerAuthProvider의 자동 로그인 시도 (`/auth/me`) 진행 중
- status === 'loading' → `<Loading fullscreen />` 표시
- status === 'authenticated' → `<Navigate to="/customer/menu" />` (Login 화면 안 보임)
- status === 'unauthenticated' → 위 폼 렌더

```tsx
const { status } = useCustomerAuth();
if (status === 'loading') return <Loading fullscreen />;
if (status === 'authenticated') return <Navigate to="/customer/menu" replace />;
return <LoginForm />;
```

---

## 7. AdminHeader (로그아웃 버튼)

> 본 컴포넌트는 다른 admin 페이지(대시보드, 메뉴 관리, 테이블 관리)에서 import해서 사용. 본 Unit이 제공하지만 본 Unit의 페이지에서는 미사용.

```tsx
function AdminHeader({ title }: { title: string }) {
  const { username, store, logout } = useAdminAuth();
  return (
    <header className={styles.adminHeader} data-testid="admin-header">
      <div>
        <h2>{title}</h2>
        <small>{store?.name} / {username}</small>
      </div>
      <Button variant="secondary" onClick={logout} data-testid="admin-logout">
        로그아웃
      </Button>
    </header>
  );
}
```

Unit 2/3/4의 admin 페이지가 자기 화면 상단에 `<AdminHeader title="..." />`만 넣으면 로그아웃 버튼 자동 추가.

---

## 8. 파일 인벤토리 (생성 예정)

```
frontend/src/
├── api/auth.ts                                  (Unit 1 신규)
├── contexts/AdminAuthContext.tsx                (Unit 1 신규)
├── contexts/CustomerAuthContext.tsx             (Unit 1 신규)
├── components/auth/AdminGuard.tsx               (Unit 1 신규)
├── components/auth/CustomerGuard.tsx            (Unit 1 신규)
├── components/auth/AdminHeader.tsx              (Unit 1 신규)
├── components/auth/index.ts                     (Unit 1 신규, barrel)
├── pages/admin/AdminLoginPage.tsx               (Unit 1 신규 — placeholder 교체)
├── pages/admin/AdminLogin.module.css            (Unit 1 신규)
├── pages/customer/CustomerLoginPage.tsx         (Unit 1 신규 — placeholder 교체)
└── api/client.ts                                (Unit 1 minimal patch: registerAuthErrorHandler)
```

```
shared/types/api/auth.ts                         (빈 → DTO 채움)
```

---

## 9. UX 디테일

| 항목 | 정책 |
|------|------|
| 입력 자동 채움 (placeholder) | `store-demo`, `admin`, 비밀번호는 비움 |
| 폼 Enter 키 | 제출 (Button type="submit" + form onSubmit) |
| 비밀번호 마스킹 | 기본 `type="password"` (Q11 없으므로 토글 미제공) |
| 모바일 키패드 | tableNumber는 `inputMode="numeric"`, password는 숫자만 받는 경우 `inputMode="numeric"` |
| 자동 포커스 | 첫 빈 입력 필드에 autoFocus |
| 에러 메시지 한글화 | `humanMessage(code)` helper로 매핑 (예: `AUTH_INVALID_CREDENTIALS` → "로그인 정보가 올바르지 않습니다") |

### `humanMessage` 매핑
```ts
const messages: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: '로그인 정보가 올바르지 않습니다',
  AUTH_TOO_MANY_ATTEMPTS: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요',
  VALIDATION_FAILED: '입력값을 확인해주세요',
  NETWORK_ERROR: '네트워크 오류. 연결을 확인해주세요',
  NETWORK_TIMEOUT: '서버 응답이 지연됩니다',
};
```
