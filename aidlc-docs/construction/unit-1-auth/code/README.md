# Unit 1 (Auth) — Generated Code Index

> Unit 1 Code Generation 산출물 인덱스. 모든 파일은 워크스페이스 루트 하위에 생성되었습니다.

## Generated / Modified File Index

### Shared types
| 파일 | 변경 종류 |
|------|-----------|
| `shared/types/api/auth.ts` | Modified (empty → 5 DTO types) |

### Backend
| 파일 | 변경 종류 |
|------|-----------|
| `backend/src/modules/auth/jwt.ts` | New |
| `backend/src/modules/auth/auth.service.ts` | New |
| `backend/src/modules/auth/auth.schemas.ts` | New |
| `backend/src/modules/auth/router.ts` | Modified (empty stub → 3 routes) |
| `backend/src/middlewares/auth.ts` | Modified (Foundation stub → real JWT verification) |
| `backend/src/common/async-handler.ts` | New (helper for Express 4 async errors) |
| `backend/tests/auth/auth.service.test.ts` | New |
| `backend/tests/auth/auth.router.test.ts` | New |
| `backend/tests/auth/auth.middleware.test.ts` | New |

### Frontend
| 파일 | 변경 종류 |
|------|-----------|
| `frontend/src/lib/humanMessage.ts` | New |
| `frontend/src/api/client.ts` | Modified (+ `registerAuthErrorHandler`, 401 detection) |
| `frontend/src/api/auth.ts` | New |
| `frontend/src/contexts/AdminAuthContext.tsx` | New |
| `frontend/src/contexts/CustomerAuthContext.tsx` | New |
| `frontend/src/components/auth/AdminGuard.tsx` | New |
| `frontend/src/components/auth/CustomerGuard.tsx` | New |
| `frontend/src/components/auth/AdminHeader.tsx` | New |
| `frontend/src/components/auth/AdminHeader.module.css` | New |
| `frontend/src/components/auth/index.ts` | New (barrel) |
| `frontend/src/pages/admin/AdminLoginPlaceholder.tsx` | Modified (placeholder → real login page, filename kept) |
| `frontend/src/pages/admin/AdminLogin.module.css` | New |
| `frontend/src/pages/customer/CustomerLoginPlaceholder.tsx` | Modified (placeholder → real auto-login page) |
| `frontend/src/pages/customer/CustomerLogin.module.css` | New |
| `frontend/src/contexts/__tests__/AdminAuthContext.test.tsx` | New |
| `frontend/src/pages/admin/__tests__/AdminLoginPage.test.tsx` | New |

## API Endpoints Implemented

| Method | Path | Auth | Body / Query | Response |
|--------|------|------|--------------|----------|
| POST | `/api/v1/admin/auth/login` | None (rate-limited) | `{ storeCode, username, password }` | `{ token, expiresAt, store, username }` |
| POST | `/api/v1/customer/auth/login` | None (rate-limited) | `{ storeCode, tableNumber, password }` | `{ token, tableId, tableNumber, store }` |
| GET | `/api/v1/customer/auth/me` | tableAuth | — | `{ tableId, tableNumber, store }` |

## Manual Verification Scenarios

```bash
# Setup (assumes Foundation install done)
npm run db:up
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run migrate
npm run seed

# Run
npm run dev:backend
npm run dev:frontend
```

| # | Scenario | Expected |
|---|----------|----------|
| 1 | `/admin/login` with `store-demo` / `admin` / `Admin1234!` | Redirect to `/admin/dashboard`, `auth.adminToken` saved |
| 2 | Refresh after #1 | Still in dashboard placeholder (admin context restored from storage) |
| 3 | `/customer/login` with `store-demo` / `1` / `0000` | Redirect to `/customer/menu`, `auth.tableToken` saved |
| 4 | Refresh after #3 | Loading flash → menu (auto-login via `/auth/me`) |
| 5 | Wrong password 5x rapidly | 6th attempt shows 429 toast + 60s countdown on button |
| 6 | Tamper `auth.tableToken` to "garbage" then navigate to `/customer/menu` | Auto-redirect to `/customer/login` (CustomerGuard + 401 handler) |
| 7 | Click "로그아웃" on AdminHeader (after Unit 3/4 wires it into admin pages) | Token cleared, redirect to `/admin/login` |

## Tests

```bash
# Backend (Prisma mocked)
npm --prefix backend test
# Expected: 12+ tests pass across health.test.ts and auth/*.test.ts

# Frontend
npm --prefix frontend test
# Expected: Button + AdminAuthContext + AdminLoginPage smoke tests pass
```

## Cross-Unit Notes

- **`adminAuth`/`tableAuth` import paths unchanged** — Unit 2/3/4 의 모든 라우트가 자동으로 실 JWT 검증을 사용합니다 (Foundation stub과 같은 export shape).
- **`api/client.ts` 변경은 backward-compatible** — `registerAuthErrorHandler` export 추가만. 기존 `api.get/post/...` 호출부 영향 없음.
- **`AdminLoginPlaceholder.tsx` / `CustomerLoginPlaceholder.tsx` 파일명 유지** — App.tsx 수정 없음. 통합 단계에서 의미 있는 파일명으로 rename 권장.

## Integration Guidance for Units 2/3/4

각 Unit의 보호 페이지에서 다음 패턴 사용:

```tsx
// 예: Unit 3 DashboardPage
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { AdminGuard, AdminHeader } from '@/components/auth';

export default function DashboardPage() {
  return (
    <AdminAuthProvider>
      <AdminGuard>
        <AdminHeader title="실시간 주문 모니터링" />
        <DashboardContent />
      </AdminGuard>
    </AdminAuthProvider>
  );
}
```

고객 페이지는 `CustomerAuthProvider` + `CustomerGuard` 사용.

## Known Limitations (워크숍 MVP)

- 토큰 무효화 메커니즘 없음 (관리자 비밀번호 변경 시 기존 JWT 유효). 운영 환경에서는 서버 측 토큰 추적 필요.
- 관리자 비밀번호 변경 UI 없음 (시드 계정만 시연).
- 백엔드 통합 테스트는 Prisma mock 기반 — 실제 DB 통합 테스트는 Build & Test 단계로 미룸.
