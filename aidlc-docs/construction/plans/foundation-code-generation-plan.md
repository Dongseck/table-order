# Foundation - Code Generation Plan

## Stage
CONSTRUCTION → Code Generation (Unit: **Foundation**) — Part 1 (Planning)

## Unit Context
- **Unit**: Foundation (공동 선작업)
- **Stories Implemented**: 없음 (FR 직접 구현 없음). Foundation은 4개 병렬 Unit이 분기하기 전 공유 토대를 제공.
- **FR Coverage 준비**: FR-01~09 전체. 각 Unit이 자기 FR을 채울 빈 골격을 마련.
- **Dependencies**: 없음. Foundation이 모든 것의 출발점.
- **Provides**: DB 스키마, 공통 코드, 인증 stub, SSE stub, TableSession stub, OrderArchive 실 구현, 공통 컴포넌트, 라우팅 쉘.
- **Out of Scope**: 각 Unit 도메인 비즈니스 로직 (auth 실제 검증, menu CRUD, order 생성, table 관리).

## Workspace Target
- **Application Code Root**: `/Users/roy/Workspace/table-order/`
- **Documentation**: `aidlc-docs/construction/foundation/code/` (markdown summaries only)

---

## Generation Approach

Greenfield 모놀리스 (루트 backend/ + frontend/ + shared/). 18단계로 분할. 각 단계는 작은 단위로 독립 실행 가능. 모든 산출물은 워크숍 MVP 수준의 단순한 코드.

### Tech Stack 확정
- Node.js 20 LTS, TypeScript 5.x (strict), npm
- Backend: Express 4, Prisma 5 (postgres prod / sqlite test), zod, bcrypt, jsonwebtoken, cors, morgan, dotenv
- Test: Jest + supertest (backend), Vitest + RTL (frontend)
- Frontend: React 18, Vite 5, react-router-dom v6, CSS Modules
- Tooling: ESLint, Prettier, Husky, lint-staged
- Docker: Postgres 16 + Node backend (frontend은 호스트 Vite)

---

## Execution Steps (체크리스트)

### Step 1. 루트 구조 & 도커 셋업
- [x] 루트 `package.json` (workspaces 없이, dev script aggregator)
  - scripts: `dev:backend`, `dev:frontend`, `db:up`, `db:down`, `migrate`, `seed`, `prepare` (husky)
- [x] `docker-compose.yml` (postgres 16 + named volume, backend 서비스 선택적)
- [x] 루트 `.gitignore` 보강 (node_modules, dist, .env, coverage)
- [x] 루트 `.editorconfig`
- [x] `.husky/pre-commit` + `.lintstagedrc.json`

**Files**:
- `package.json`
- `docker-compose.yml`
- `.gitignore`
- `.editorconfig`
- `.husky/pre-commit`
- `.lintstagedrc.json`

---

### Step 2. Shared Types 작성 (`shared/types/`)
- [x] `domain.ts` — 10개 엔티티 타입 (`functional-design/domain-entities.md` §TypeScript)
- [x] `api/common.ts` — `ApiSuccess<T>`, `ApiErrorBody`, `OrderStatus` re-export
- [x] `api/auth.ts` — `export {}` (Unit 1 채움)
- [x] `api/menu.ts` — `export {}` (Unit 2 채움)
- [x] `api/order.ts` — `export {}` (Unit 3 채움)
- [x] `api/table.ts` — `export {}` (Unit 4 채움)
- [x] `events.ts` — `SseEvent` 타입 (4종 이벤트 union)

**Files**:
- `shared/types/domain.ts`
- `shared/types/api/{common,auth,menu,order,table}.ts`
- `shared/types/events.ts`

---

### Step 3. Backend 프로젝트 셋업
- [x] `backend/package.json` — 의존성 + scripts
- [x] `backend/tsconfig.json` — strict, `@shared/*` path alias
- [x] `backend/.env.example` — 4종 (DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT)
- [x] `backend/.eslintrc.cjs`
- [x] `backend/.prettierrc`
- [x] `backend/nodemon.json` 또는 `ts-node-dev` 설정
- [x] `backend/Dockerfile` (Step 16에서 작성)

**Dependencies (production)**:
`express`, `@prisma/client`, `bcrypt`, `jsonwebtoken`, `zod`, `cors`, `morgan`, `dotenv`

**Dependencies (dev)**:
`typescript`, `ts-node-dev`, `prisma`, `@types/express`, `@types/bcrypt`, `@types/jsonwebtoken`, `@types/morgan`, `@types/cors`, `@types/node`, `eslint`, `prettier`, `jest`, `ts-jest`, `supertest`, `@types/jest`, `@types/supertest`

---

### Step 4. Database Schema, Migration, Seed
- [x] `backend/prisma/schema.prisma` — 10개 엔티티 (postgresql provider)
- [x] `backend/prisma/seed.ts` — Store 1 + AdminUser 1 + Table 10 + Category 3 + MenuItem 9
- [x] `backend/prisma/test.schema.prisma` — sqlite 미러 (테스트 전용)
- [x] 초기 migration은 `npm run migrate` 명령으로 개발자가 실행 (DB 컨테이너 필요)
- [x] `aidlc-docs/construction/foundation/code/schema-summary.md` — Step 18에서 작성

**Files**:
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/prisma/test.schema.prisma`

---

### Step 5. Backend Common 모듈 (`backend/src/common/`)
- [x] `prisma.ts` — `PrismaClient` 싱글톤
- [x] `error.ts` — `AppError` 클래스 (code, message, httpStatus, details)
- [x] `error-codes.ts` — Unit별 섹션 + append-only 컨벤션 주석
- [x] `error-handler.ts` — Express 전역 에러 핸들러 (AppError → 응답 변환, ZodError → VALIDATION_FAILED)
- [x] `response.ts` — `ok(data)`, `fail(error)` 헬퍼
- [x] `validation.ts` — 공통 zod 스키마 + `validateBody(schema)` 미들웨어
- [x] `constants.ts` — BCRYPT_COST, RATE_LIMIT, SSE_HEARTBEAT_MS
- [x] `rate-limiter.ts` — 인메모리 IP+key 카운터

**Files**: 8개

---

### Step 6. Backend Middlewares (`backend/src/middlewares/`)
- [x] `auth.ts` — `adminAuth`/`tableAuth` **실 동작 stub** (시드 관리자 id=1, storeId=1로 통과). Express Request 타입 확장.
- [x] `request-logger.ts` — morgan 래퍼
- [x] `not-found.ts` — 404 핸들러

**Files**: 3개

---

### Step 7. Backend Module Stubs (`backend/src/modules/`)
각 모듈의 `router.ts`는 빈 Express Router만 export. Foundation이 제공하는 stub 서비스도 작성.

- [x] `auth/router.ts` — `export const authRouter = Router()` (빈)
- [x] `menu/router.ts` — 빈
- [x] `order/router.ts` — 빈
- [x] `order/order.archive.ts` — `archiveSessionOrders(tx, sessionId)` **실 구현** (모든 Unit이 그대로 사용 가능)
- [x] `sse/router.ts` — 빈
- [x] `sse/sse.manager.ts` — `SseEvent` 타입 + `ISseManager` + `StubSseManager` (console 출력)
- [x] `table/router.ts` — 빈
- [x] `table/table-session.service.ts` — `ITableSessionService` + `StubTableSessionService` (`getOrStartActiveSession` 실 동작, `completeSession`은 NOT_IMPLEMENTED throw)

**Files**: 8개

---

### Step 8. Backend Entrypoint (`backend/src/`)
- [x] `app.ts` — express 앱 구성. 모든 라우터 사전 등록, `/health` 엔드포인트, errorHandler/not-found.
- [x] `server.ts` — `process.env.TZ = 'Asia/Seoul'` 설정 + 서버 listen
- [x] `config.ts` — `.env` 로드 + 검증

**Files**: 3개

---

### Step 9. Backend 테스트 셋업
- [x] `backend/jest.config.ts` — ts-jest preset, sqlite test 환경
- [x] `backend/tests/setup.ts` — Prisma 테스트 클라이언트 셋업
- [x] `backend/tests/health.test.ts` — `/health` 엔드포인트 smoke test

**Files**: 3개

---

### Step 10. Frontend 프로젝트 셋업
- [x] `frontend/package.json`
- [x] `frontend/tsconfig.json` (strict, `@shared/*` path alias, `@/*` self alias)
- [x] `frontend/vite.config.ts` — react plugin, path alias, port 5173, proxy `/api` → `http://localhost:3000`
- [x] `frontend/.env.example` — `VITE_API_BASE_URL`
- [x] `frontend/.eslintrc.cjs`
- [x] `frontend/.prettierrc`
- [x] `frontend/index.html`
- [x] `frontend/vitest.config.ts`
- [x] `frontend/src/main.tsx`
- [x] `frontend/src/styles/tokens.css`
- [x] `frontend/src/styles/reset.css`

**Dependencies**:
`react`, `react-dom`, `react-router-dom`
**Dev**: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `eslint`, `prettier`, `@types/react`, `@types/react-dom`

---

### Step 11. Frontend 공통 컴포넌트 (`frontend/src/components/common/`)
- [x] `Button.tsx` + `Button.module.css` (variant, size, loading, 44px↑)
- [x] `Modal.tsx` + `.module.css` (open, onClose, ESC, backdrop)
- [x] `Loading.tsx` + `.module.css` (size, fullscreen)
- [x] `ConfirmDialog.tsx` (Modal 활용)
- [x] `Toast.tsx` + `.module.css` (Provider 포함)
- [x] `Input.tsx` (label, error)
- [x] `Select.tsx` (options, value, onChange)
- [x] `TextArea.tsx` (maxLength counter)
- [x] `index.ts` — barrel export
- [x] `Form.module.css` — Input/Select/TextArea 공유 스타일

각 컴포넌트는 `data-testid` 부착 (automation friendly).

**Files**: 컴포넌트 8 × 2(tsx+css) + index = ~17개

---

### Step 12. Frontend Infra (`frontend/src/`)
- [x] `api/client.ts` — `api.{get,post,patch,delete}` + `ApiError` 클래스 + 토큰 자동 부착 + 10s timeout
- [x] `hooks/useApi.ts` — 공통 fetch hook
- [x] ToastProvider — `components/common/Toast.tsx`에 통합

**Files**: 3개

---

### Step 13. Frontend App Shell (`frontend/src/`)
- [x] `App.tsx` — `<ToastProvider>` + `<BrowserRouter>` + 9개 라우트 + NotFound
- [x] `pages/PlaceholderLayout.tsx` (재사용 레이아웃)
- [x] `pages/customer/CustomerLoginPlaceholder.tsx`
- [x] `pages/customer/CustomerMenuPlaceholder.tsx`
- [x] `pages/customer/OrderConfirmPlaceholder.tsx`
- [x] `pages/customer/OrderHistoryPlaceholder.tsx`
- [x] `pages/admin/AdminLoginPlaceholder.tsx`
- [x] `pages/admin/DashboardPlaceholder.tsx`
- [x] `pages/admin/MenuManagePlaceholder.tsx`
- [x] `pages/admin/TableManagePlaceholder.tsx`
- [x] `pages/NotFound.tsx`

각 placeholder는 "TODO: Unit N 담당자가 구현" 메시지 + 컴포넌트 데모(공통 컴포넌트 사용 예) 1개.

**Files**: 10개

---

### Step 14. Frontend 테스트 셋업
- [x] `frontend/tests/setup.ts` — `@testing-library/jest-dom` import
- [x] `frontend/src/components/common/__tests__/Button.test.tsx` — smoke test

**Files**: 2개

---

### Step 15. Tooling 통합
- [x] backend/frontend 각자 ESLint config (root config 대신 분산)
- [x] backend/frontend 각자 Prettier 설정
- [x] Husky pre-commit → lint-staged 동작 (`.husky/pre-commit` + `.lintstagedrc.json`)
- [x] 루트 `package.json` aggregator scripts (lint/test/build)

---

### Step 16. Backend Docker 통합
- [x] `backend/Dockerfile` (다단계 빌드: deps, build, runtime)
- [x] `backend/.dockerignore`
- [x] `docker-compose.yml`에 backend 서비스 추가 (profile: full)

**Files**: 2개 (+1 수정)

---

### Step 17. README & 개발자 가이드
- [x] 루트 `README.md` 보강 — Quick Start, 디렉토리 구조, Unit 분담, Cross-Unit Stub, 명령어
- [x] DEVELOPER_GUIDE는 `aidlc-docs/construction/foundation/code/api-contract-summary.md`로 갈음

**Files**: 1~2개

---

### Step 18. Foundation Code Summary 문서
- [x] `aidlc-docs/construction/foundation/code/README.md` — 생성된 파일 인덱스 + 검증 명령
- [x] `aidlc-docs/construction/foundation/code/api-contract-summary.md` — `/health` + Common Middleware + Cross-Unit Stub 사용 예제

**Files**: 2개

---

## Story Traceability
Foundation은 FR을 직접 구현하지 않지만 다음을 **준비**합니다:

| FR | Foundation 준비물 |
|----|-------------------|
| FR-01~09 모두 | Prisma 스키마, 공통 응답, 인증 stub, 라우팅 쉘 |
| FR-01 (테이블 자동 로그인) | `auth.tableToken` localStorage 키, `CustomerLoginPlaceholder` |
| FR-04 (주문 생성) | `archiveSessionOrders` 헬퍼 (이용 완료 시 사용), TableSession stub |
| FR-07 (실시간 모니터링) | `SseEvent` 타입, sse.manager stub |
| FR-08 (이용 완료) | `archiveSessionOrders` 실 구현 |

---

## Risk & Mitigation
| Risk | Mitigation |
|------|-----------|
| Prisma sqlite/postgres provider 차이 | 표준 SQL만 사용 (timestamp without timezone, INT auto-increment) |
| 4명이 통합 시 stub 교체 충돌 | cross-unit-contracts.md에 import 경로/시그니처 고정. 통합 시 3개 파일만 영향. |
| Foundation 코드 양 과다 | 워크숍 MVP 수준으로 컴포넌트는 단순화 (no design system, no animation 등) |

---

## Definition of Done
- [ ] 모든 Step의 체크박스 [x]
- [ ] `npm install` (루트, backend, frontend) 성공
- [ ] `docker compose up -d db` + `npm run migrate` 성공
- [ ] `npm run seed` → 시드 데이터 9 메뉴 확인
- [ ] `npm run dev:backend` → `http://localhost:3000/health` 200 응답
- [ ] `npm run dev:frontend` → `http://localhost:5173`에서 9개 placeholder 라우트 동작
- [ ] `npm test` (backend smoke test 1개 + frontend smoke test 1개) 통과
- [ ] 4명이 자기 Unit 브랜치 분기 가능 상태

---

## 다음 단계
이 계획을 **사용자가 승인**하면 Part 2 (Generation) 실행. Step 1부터 순차적으로 코드 생성, 각 Step 완료 시 체크박스 [x] 마킹.
