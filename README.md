# 테이블오더 서비스

디지털 주문 시스템을 통해 고객에게는 편리한 주문 경험을, 매장 운영자에게는 효율적인 운영 환경을 제공하는 테이블오더 플랫폼.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20 + Express 4 + TypeScript (strict) |
| Frontend | React 18 + Vite 5 + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM 5 |
| Real-time | Server-Sent Events (SSE) |
| Auth | JWT 16h (Admin) + JWT 무기한 (Table API Key) |
| Test | Jest + supertest (BE), Vitest + RTL (FE) |
| Infra | Docker Compose |

## Directory Structure

```
table-order/
├── backend/                    # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── common/             # Foundation - error, validation, prisma 등
│   │   ├── middlewares/        # auth(stub→Unit1), request-logger, not-found
│   │   ├── modules/
│   │   │   ├── auth/router.ts          # Unit 1
│   │   │   ├── menu/router.ts          # Unit 2
│   │   │   ├── order/router.ts         # Unit 3
│   │   │   ├── order/order.archive.ts  # Foundation (실 구현)
│   │   │   ├── sse/sse.manager.ts      # stub→Unit 3
│   │   │   └── table/table-session.service.ts  # stub→Unit 4
│   │   ├── app.ts              # Foundation 사전 등록 (수정 금지)
│   │   └── server.ts
│   └── prisma/schema.prisma    # Foundation 소유
├── frontend/                   # React + Vite + TS
│   ├── src/
│   │   ├── components/common/  # 8개 공통 컴포넌트
│   │   ├── pages/{customer,admin}/  # 각 Unit이 placeholder 교체
│   │   ├── api/client.ts
│   │   └── App.tsx             # Foundation 사전 등록 (수정 금지)
├── shared/types/               # FE/BE 공유 타입 (@shared/*)
│   ├── domain.ts               # Foundation 소유
│   ├── api/{auth,menu,order,table}.ts  # Unit별 소유
│   └── events.ts
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 20+

### Setup
```bash
# 1. Install dependencies (root, backend, frontend)
npm run install:all

# 2. Start DB
npm run db:up

# 3. Apply migrations + seed
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run migrate
npm run seed

# 4. Run dev servers (in two terminals)
npm run dev:backend     # http://localhost:3000
npm run dev:frontend    # http://localhost:5173
```

### Seed Credentials
- **Store**: `store-demo` / 데모 매장
- **Admin**: `admin` / `Admin1234!`
- **Tables**: 1~10 (모두 비밀번호 `0000`)
- **Categories**: 식사, 사이드, 음료 (각 3개씩 총 9개 메뉴)

### Verify Foundation
```bash
curl http://localhost:3000/health
# → {"success":true,"data":{"ok":true,"ts":"..."}}

# Frontend: http://localhost:5173 → /customer/menu placeholder 표시
```

## Team Structure — 4인 병렬 개발

### Development Flow

```
     Foundation (공동 선작업, 완료)
    /       |       |        \
Unit 1    Unit 2   Unit 3   Unit 4
(Auth)   (Menu)   (Order)  (Table)
  독립     독립     독립     독립
    \       |       |        /
         통합 (전원, 마지막)
```

### Branch Strategy

| Branch | 담당 | 설명 |
|--------|------|------|
| `main` | - | 안정 버전 |
| `unit/auth` | A | 인증/인가 (JWT, 미들웨어, 로그인 UI) |
| `unit/menu` | B | 메뉴/카테고리 (CRUD API + UI) |
| `unit/order` | C | 주문 + SSE (장바구니, 주문, 대시보드) |
| `unit/table` | D | 테이블 (CRUD, 세션, 이용완료, 과거내역) |

### Cross-Unit Stubs (Foundation 제공)
- `middlewares/auth.ts` — adminAuth/tableAuth: 시드 관리자/테이블로 통과 (Unit 1이 교체)
- `modules/table/table-session.service.ts` — `getOrStartActiveSession` 실 동작 (Unit 4 완성 전 Unit 3 사용 가능)
- `modules/sse/sse.manager.ts` — broadcast 콘솔 출력 stub (Unit 3 완성 전 Unit 4 호출 가능)
- `modules/order/order.archive.ts` — **완전 동작** (Unit 4가 통합 시 그대로 사용)

상세: `aidlc-docs/construction/foundation/functional-design/cross-unit-contracts.md`

## Unit별 담당 범위

### Unit 1: Auth (담당자 A)
- **FR-01** 테이블 자동 로그인, **FR-06** 관리자 인증 (JWT 16h)
- Files: `backend/src/modules/auth/*`, `middlewares/auth.ts`, `frontend/src/pages/*/(*)LoginPlaceholder.tsx`, `frontend/src/contexts/*AuthContext.tsx`

### Unit 2: Menu (담당자 B)
- **FR-02** 메뉴 조회, **FR-09** 메뉴 관리
- Files: `backend/src/modules/menu/*`, `frontend/src/pages/customer/CustomerMenuPlaceholder.tsx`, `frontend/src/pages/admin/MenuManagePlaceholder.tsx`

### Unit 3: Order + SSE (담당자 C)
- **FR-03~05** 장바구니/주문/내역, **FR-07** 실시간 모니터링
- Files: `backend/src/modules/order/*`, `backend/src/modules/sse/*`, `frontend/src/pages/admin/DashboardPlaceholder.tsx`, `frontend/src/contexts/CartContext.tsx`

### Unit 4: Table (담당자 D)
- **FR-08** 테이블 관리 + 이용 완료 + 과거 내역
- Files: `backend/src/modules/table/*`, `frontend/src/pages/admin/TableManagePlaceholder.tsx`

## Useful Commands

```bash
npm run dev:backend           # backend dev (http://localhost:3000)
npm run dev:frontend          # frontend dev (http://localhost:5173)
npm run db:up                 # docker compose up -d db
npm run db:down               # docker compose down
npm run migrate               # prisma migrate dev
npm run seed                  # 시드 데이터 삽입
npm run lint                  # 전체 lint
npm run test                  # backend + frontend test
npm run build                 # production build
```

## 설계 문서

- [요구사항](aidlc-docs/inception/requirements/requirements.md)
- [Application Design](aidlc-docs/inception/application-design/application-design.md)
- [Unit of Work](aidlc-docs/inception/application-design/unit-of-work.md)
- [Foundation Functional Design](aidlc-docs/construction/foundation/functional-design/)
- [Cross-Unit Contracts](aidlc-docs/construction/foundation/functional-design/cross-unit-contracts.md)
