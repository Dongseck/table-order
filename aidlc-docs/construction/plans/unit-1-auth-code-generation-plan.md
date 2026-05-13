# Unit 1 (Auth) — Code Generation Plan

## Stage
CONSTRUCTION → Code Generation (Unit 1: Auth) — Part 1 (Planning)

## Branch
`unit/auth`

## Unit Context
- **FR Coverage**: FR-01 (테이블 자동 로그인), FR-06 (관리자 16h JWT), NFR-02 (보안)
- **Dependencies**: Foundation 머지본만 의존. 다른 Unit과 의존 없음.
- **Cross-Unit Impact**:
  - `backend/src/middlewares/auth.ts` stub → 실 검증으로 교체 (import 경로 동일)
  - `frontend/src/api/client.ts`에 `registerAuthErrorHandler` 등 ~10줄 추가 (기존 API 영향 없음)
  - `shared/types/api/auth.ts` 빈 → DTO 채움

## Generation Approach
워크숍 MVP. 17 Step으로 분할. 각 단계 작은 단위 + 자기 검증 가능.

### Tech Stack (Foundation 재사용)
- Backend: Express, Prisma, `bcrypt`, `jsonwebtoken`, `zod` (모두 Foundation에 설치됨)
- Frontend: React 18, `react-router-dom`, Foundation 공통 컴포넌트
- Tests: Jest + supertest (backend), Vitest + RTL (frontend)

---

## Execution Steps (체크리스트)

### Step 1. Shared Auth Types
- [x] `shared/types/api/auth.ts` 채움
  - `AdminLoginRequest`, `AdminLoginResponse`
  - `CustomerLoginRequest`, `CustomerLoginResponse`
  - `CustomerMeResponse`
  - `StoreInfo` (interface)

**Files**: 1 modified

---

### Step 2. Backend JWT Utility
- [x] `backend/src/modules/auth/jwt.ts`
  - `signAdminToken(payload) → { token, expiresAt }`
  - `signTableToken(payload) → { token }`
  - `verifyAdminToken(token) → { adminUserId, storeId }` (throws AppError)
  - `verifyTableToken(token) → { tableId, storeId }`
  - JWT_SECRET, JWT_EXPIRES_IN은 `config.ts`에서

**Files**: 1 new

---

### Step 3. Backend Auth Service
- [x] `backend/src/modules/auth/auth.service.ts`
  - `adminLogin(storeCode, username, password)` → `{ token, expiresAt, store, username }`
  - `tableLogin(storeCode, tableNumber, password)` → `{ token, tableId, tableNumber, store }`
  - `getCurrentTable(tableId)` → `{ tableId, tableNumber, store }`
  - Prisma 조회 + bcrypt.compare + jwt.sign 조합
  - 실패 시 `AUTH_INVALID_CREDENTIALS` AppError

**Files**: 1 new

---

### Step 4. Backend Auth Router
- [x] `backend/src/modules/auth/router.ts` (빈 stub → 채움)
  - `POST /admin/auth/login` (loginRateLimiter + validateBody + handler)
  - `POST /customer/auth/login` (loginRateLimiter + validateBody + handler)
  - `GET /customer/auth/me` (tableAuth + handler)
  - 각 핸들러는 async + try/catch 없이 (errorHandler가 잡음) — express-async 처리 위해 wrapper 사용 또는 Express 5 native 지원 활용
  - Express 4 사용 중이므로 async wrapper helper 추가: `asyncHandler(fn)`

**Files**: 1 modified + (1 new helper `backend/src/common/async-handler.ts`)

---

### Step 5. Backend Auth Middleware (Stub → 실 구현)
- [x] `backend/src/middlewares/auth.ts` 본 파일 전체 교체
  - `adminAuth`: Bearer 토큰 → verifyAdminToken → `req.auth = {...}`
  - `tableAuth`: 헤더 + `?token=` 쿼리스트링 둘 다 지원 → verifyTableToken
  - JWT 실패 시 AppError throw (errorHandler가 401 응답)

**Files**: 1 modified

---

### Step 6. Backend Validation Schemas (Auth 전용)
- [x] `backend/src/modules/auth/auth.schemas.ts`
  - `AdminLoginBodySchema` (storeCode + username + password)
  - `CustomerLoginBodySchema` (storeCode + tableNumber + password)
  - Foundation `StoreCodeSchema`, `AdminUsernameSchema`, `TableNumberSchema` 재사용

**Files**: 1 new

---

### Step 7. Backend Tests
- [x] `backend/tests/auth/auth.service.test.ts`
  - adminLogin 성공/실패 (Store/User/Password 케이스)
  - tableLogin 성공/실패
  - getCurrentTable 성공
- [x] `backend/tests/auth/auth.router.test.ts`
  - POST admin login 200/401/400/429
  - POST customer login 200/401
  - GET /customer/auth/me 200/401
- [x] `backend/tests/auth/auth.middleware.test.ts`
  - adminAuth: 토큰 없음/유효/만료/위변조 4 케이스
  - tableAuth: 헤더/쿼리스트링 양쪽

> **테스트 전략 (워크숍 MVP)**: SQLite 인메모리 fixture 셋업 부담을 피하기 위해, **Prisma를 jest.mock으로 mocking**하는 방식 채택. 통합 테스트의 supertest는 createApp의 prisma client를 mock된 인스턴스로 대체. SQLite 셋업은 향후 Build & Test 단계로 미룸.

**Files**: 3 new

---

### Step 8. Frontend Shared Helpers
- [x] `frontend/src/lib/humanMessage.ts` — 에러 코드 → 한글 메시지 매핑

**Files**: 1 new

---

### Step 9. Frontend API Client Patch
- [x] `frontend/src/api/client.ts` 패치
  - `registerAuthErrorHandler(handler)` export
  - request() 함수에서 401 + AUTH_TOKEN_* 코드 발견 시 핸들러 호출 (throw는 그대로 유지)
  - 기존 API (api.get/post/...) 시그니처 변경 없음

**Files**: 1 modified

---

### Step 10. Frontend Auth API Wrapper
- [x] `frontend/src/api/auth.ts`
  - `adminLogin(input)` → POST `/admin/auth/login`
  - `customerLogin(input)` → POST `/customer/auth/login`
  - `customerMe()` → GET `/customer/auth/me`

**Files**: 1 new

---

### Step 11. Frontend AdminAuthContext
- [x] `frontend/src/contexts/AdminAuthContext.tsx`
  - Provider + useAdminAuth hook
  - mount 시 localStorage 토큰 확인 → 있으면 authenticated 상태로 시작 (검증 endpoint 미제공)
  - login/logout 메서드
  - registerAuthErrorHandler에 logout 콜백 등록

**Files**: 1 new

---

### Step 12. Frontend CustomerAuthContext
- [x] `frontend/src/contexts/CustomerAuthContext.tsx`
  - 동일 패턴
  - mount 시 토큰 있으면 `/auth/me` 호출하여 검증 → 성공 시 authenticated
  - registerAuthErrorHandler 등록

**Files**: 1 new

---

### Step 13. Frontend Guards & Header
- [x] `frontend/src/components/auth/AdminGuard.tsx`
- [x] `frontend/src/components/auth/CustomerGuard.tsx`
- [x] `frontend/src/components/auth/AdminHeader.tsx` + `AdminHeader.module.css`
- [x] `frontend/src/components/auth/index.ts` — barrel

**Files**: 5 new

---

### Step 14. Frontend Admin Login Page (Placeholder 교체)
- [x] `frontend/src/pages/admin/AdminLoginPlaceholder.tsx` **파일 자체를 실 구현으로 교체**
  - 또는 이름 변경 후 App.tsx import 영향 검토. App.tsx 비수정 원칙 준수 위해 **파일명 유지하고 내용만 교체**.
  - 또는 placeholder는 두고 새 파일 `AdminLoginPage.tsx` 추가 + App.tsx 수정 → 비추천.
  - **결정**: `AdminLoginPlaceholder.tsx` 내용 교체 (파일명 유지). 추후 통합 시 rename.
- [x] `frontend/src/pages/admin/AdminLogin.module.css`

**Files**: 1 modified + 1 new

---

### Step 15. Frontend Customer Login Page (Placeholder 교체)
- [x] `frontend/src/pages/customer/CustomerLoginPlaceholder.tsx` 내용 교체
- [x] `frontend/src/pages/customer/CustomerLogin.module.css`

**Files**: 1 modified + 1 new

---

### Step 16. Frontend Tests
- [x] `frontend/src/contexts/__tests__/AdminAuthContext.test.tsx` — login/logout 흐름 mock
- [x] `frontend/src/pages/admin/__tests__/AdminLoginPage.test.tsx` — 폼 제출/에러 표시 smoke

**Files**: 2 new

---

### Step 17. Code Summary 문서
- [x] `aidlc-docs/construction/unit-1-auth/code/README.md` — 생성 파일 인덱스, 검증 명령, 통합 노트

**Files**: 1 new

---

## Story Traceability

| FR | Step 매핑 |
|----|-----------|
| FR-01 (테이블 자동 로그인) | Step 1, 3, 4, 5, 10, 12, 13, 15 |
| FR-06 (관리자 16h JWT) | Step 1, 2, 3, 4, 5, 10, 11, 13, 14 |
| NFR-02 (bcrypt/JWT/rate limit) | Step 2, 3, 5 (Foundation rate-limiter 활용) |

---

## Definition of Done

- [x] 모든 Step 체크박스 [x]
- [x] `npm run test --prefix backend` → auth 테스트 통과 (서비스/라우터/미들웨어)
- [x] `npm run test --prefix frontend` → AdminAuth + AdminLoginPage 테스트 통과
- [x] `npm run dev:backend` + `npm run dev:frontend` 후 수동 시나리오:
  - `/admin/login` → admin/Admin1234! → `/admin/dashboard` 이동 + 토큰 localStorage 저장
  - `/customer/login` → store-demo/1/0000 → `/customer/menu` 이동 + 토큰 저장
  - 페이지 새로고침 시 자동 로그인 유지
  - 로그인 5회 실패 → 429 + 카운트다운
  - 잘못된 토큰 수동 주입 후 호출 → 자동 로그아웃 + 로그인 페이지
- [x] `git diff` 검토 — Foundation 소유 파일 중 client.ts/auth middleware 외에는 수정 없음

---

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| Prisma client mocking 복잡 | jest.mock 활용 + 최소 mocking (구체 메서드만) |
| AsyncHandler 누락 시 Express가 reject 못 잡음 | `common/async-handler.ts` helper로 모든 async route 감쌈 |
| AdminAuthContext가 토큰 검증 없이 authenticated 시작 → 만료 토큰으로 첫 호출 시 401 | 첫 API 호출 시 `registerAuthErrorHandler`가 자동 로그아웃 처리 ✓ |
| Placeholder 파일명 유지로 인한 어색함 | 통합 단계에서 rename + App.tsx 수정 가능. MVP 단계는 그대로. |

---

## 다음 단계
사용자 승인 후 Part 2 (Generation) 시작 → Step 1부터 순차 실행.
