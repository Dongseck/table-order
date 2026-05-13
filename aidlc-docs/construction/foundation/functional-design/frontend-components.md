# Foundation — Frontend Components & Shell

> Foundation이 제공하는 **공통 컴포넌트, App 라우팅 쉘, API 클라이언트**의 함수적(Functional) 명세.
> 각 Unit은 이 컴포넌트들을 가져다 자기 페이지를 만듭니다.

---

## 1. 공통 컴포넌트 (`src/components/common/`)

전부 단순/MVP 수준. 접근성: 모든 클릭 가능 영역은 **최소 44×44px**(NFR-03-1).

### 1.1 Button
```ts
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';   // default 'primary'
  size?: 'sm' | 'md' | 'lg';                       // default 'md', 모두 44px↑ 보장
  disabled?: boolean;
  loading?: boolean;       // true면 spinner + disable
  onClick?: () => void;
  type?: 'button' | 'submit';
  children: React.ReactNode;
}
```

### 1.2 Modal
```ts
interface ModalProps {
  open: boolean;
  onClose: () => void;     // ESC 키 또는 backdrop 클릭 시 호출
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```
- open=true이면 `<body>` 스크롤 잠금.
- ESC 키 / backdrop 클릭으로 close.

### 1.3 Loading
```ts
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';   // default 'md'
  fullscreen?: boolean;        // true면 전체 화면 오버레이
  message?: string;
}
```

### 1.4 ConfirmDialog
```ts
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;       // default '확인'
  cancelLabel?: string;        // default '취소'
  danger?: boolean;            // true면 confirm 버튼 danger 스타일
  onConfirm: () => void;
  onCancel: () => void;
}
```
- 사용처: 주문 삭제 확인, 이용 완료 확인 등.

### 1.5 Toast / ErrorBanner
```ts
// Context 기반 전역 사용
useToast(): {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
}
```
- `<ToastProvider>`를 `App.tsx`에 한 번만 mount.
- 자동 닫힘 3초.

### 1.6 Form 기초
```ts
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;          // 표시 시 빨간 테두리 + 메시지
}
interface SelectProps {
  label?: string;
  options: Array<{ value: string | number; label: string }>;
  value: string | number;
  onChange: (v: string | number) => void;
  error?: string;
}
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;      // 글자수 카운터 자동 표시
}
```

---

## 2. App 라우팅 쉘 (`src/App.tsx`)

- 라이브러리: **react-router-dom v6**
- 라우트 구성:

```
/                          → /customer (redirect)
/customer/login            → CustomerLoginPlaceholder       (Unit 1)
/customer/menu             → CustomerMenuPlaceholder        (Unit 2)
/customer/order/confirm    → OrderConfirmPlaceholder        (Unit 3)
/customer/order/history    → OrderHistoryPlaceholder        (Unit 3)
/admin/login               → AdminLoginPlaceholder          (Unit 1)
/admin/dashboard           → DashboardPlaceholder           (Unit 3)
/admin/menus               → MenuManagePlaceholder          (Unit 2)
/admin/tables              → TableManagePlaceholder         (Unit 4)
*                          → NotFound
```

- Foundation은 각 라우트에 **placeholder 컴포넌트**를 매핑. 내용은 "TODO: Unit N 담당자가 구현" 텍스트만 표시.
- 각 Unit 담당자는 자기 라우트의 컴포넌트만 실제 구현으로 교체. 다른 라우트 코드 변경 없음.
- 라우트 자체는 인증 가드 없이 통과 (Auth Guard는 Unit 1이 통합 시 추가).

### Provider 트리
```
<ToastProvider>
  <BrowserRouter>
    <Routes>...</Routes>
  </BrowserRouter>
</ToastProvider>
```
Auth Context, Cart Context는 Foundation에서 추가하지 않음 — 각 담당 Unit에서 자기 Context를 추가 wrap.

---

## 3. API Client (`src/api/client.ts`)

```ts
class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

interface RequestOptions {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  // 인증 토큰은 자동으로 localStorage에서 부착 (아래 정책 참조)
}

export const api = {
  get<T>(path: string, opts?: RequestOptions): Promise<T>,
  post<T>(path: string, opts?: RequestOptions): Promise<T>,
  patch<T>(path: string, opts?: RequestOptions): Promise<T>,
  delete<T>(path: string, opts?: RequestOptions): Promise<T>,
};
```

### 기능 (워크숍 MVP)
- A) `baseURL = import.meta.env.VITE_API_BASE_URL`
- B) 공통 헤더: `Content-Type: application/json` + `Authorization: Bearer <token>` (있을 때만)
- C) 응답 자동 unwrap: `{success:true, data}` → `data` 반환. `{success:false, error}` → `throw new ApiError(...)`. 그 외(네트워크/JSON 파싱 실패) → `throw new ApiError('NETWORK_ERROR', ...)`
- D) **토큰 자동 부착**: `localStorage`의 `auth.token` 또는 `auth.tableToken`. 키 결정 로직:
  - 경로가 `/admin/`로 시작 → `auth.adminToken`
  - 경로가 `/customer/`로 시작 → `auth.tableToken`
- E) 401 자동 처리는 **하지 않음** — 호출부(Auth Context)가 잡아서 로그아웃 처리.
- F) **요청 timeout 10초** (`AbortController`).

### 사용 예
```ts
const menus = await api.get<MenusResponse>('/customer/menus');
const order = await api.post<Order>('/customer/orders', { body: { items } });
```

### Hook: `useApi`
공통 로딩/에러 보일러플레이트 줄이기:
```ts
const { data, loading, error, run } = useApi(() => api.get('/customer/menus'));
```
- mount 시 자동 실행 옵션, manual 모드 지원.
- 에러는 `ApiError` 그대로 노출 → 호출부가 toast 등으로 표시.

---

## 4. Token 저장 정책

| 키 | 저장소 | 만료 |
|----|--------|------|
| `auth.adminToken` | `localStorage` | JWT 자체 만료(16h) |
| `auth.tableToken` | `localStorage` | 무기한 |
| `cart` | `localStorage` (Unit 3) | 명시적 비우기 |

> Foundation은 localStorage 키 이름만 표준화. 실제 read/write는 각 Unit의 Context에서.

---

## 5. 공유 타입 사용 (`@shared/*`)

Frontend `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": { "@shared/*": ["../shared/*"] }
  }
}
```

사용 예:
```ts
import type { MenuItem, Order, OrderStatus } from '@shared/types/domain';
import type { CreateOrderRequest, OrdersResponse } from '@shared/types/api/order';   // Unit 3
import type { MenusResponse } from '@shared/types/api/menu';                          // Unit 2
```

`shared/types/api/`는 Unit별 파일로 분할되어 있어 4명이 동시 작업해도 git 충돌 없음. 자세한 분할 규칙: [cross-unit-contracts.md §1.1](./cross-unit-contracts.md#11-sharedtypes-분할)

Backend도 동일 alias로 동일 타입을 사용 → **요청/응답 타입이 한 곳**에서 관리됨.

---

## 6. 스타일링 / 디자인 시스템

- CSS 방식: **CSS Modules** (각 컴포넌트별 `.module.css`).
- 디자인 토큰(`src/styles/tokens.css`): 색상, spacing, font-size, radius.
- 글로벌 reset: `src/styles/reset.css`.
- 별도 UI 라이브러리(MUI/AntD) 미사용 — MVP 단순성.
- 반응형: 모바일/태블릿 first. 데스크탑은 max-width 1280px 기준 그리드.

---

## 7. Foundation 단계의 Frontend Exit Criteria

- `npm run dev`로 5173 포트에서 Vite 기동.
- `/customer/menu`, `/admin/dashboard` 등 모든 라우트가 placeholder 화면을 표시.
- 공통 컴포넌트 8종이 Storybook 없이도 단순 데모 페이지(`/_dev/components`, 라우트 등록 선택)에서 확인 가능 (선택사항).
- `api.get('/health')` 호출 성공 (Backend Foundation의 health 엔드포인트와 연동).
- 4명이 각자 자기 페이지(placeholder)를 실제 컴포넌트로 교체하기만 하면 됨 — 라우트/Provider/공통 컴포넌트 추가 작업 불필요.
