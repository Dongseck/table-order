# Unit of Work Definitions

## Decomposition Strategy
- **기준**: 도메인 기반 풀스택 분리
- **인원**: 4명 동시 병렬 개발
- **총 단위 수**: 4개 (+ Foundation 공동 선작업)
- **핵심 원칙**: 각 Unit은 완전히 독립적으로 개발 가능

---

## Dependency Graph

```
     Foundation (공동 선작업, 1회)
    /       |       |        \
Unit 1    Unit 2   Unit 3   Unit 4
(Auth)   (Menu)   (Order)  (Table)
  독립     독립     독립     독립
```

- 4개 Unit 간 **상호 의존 없음** (완전 병렬)
- 모든 Unit은 Foundation에만 의존

---

## Foundation: 프로젝트 기반 (공동 선작업)

### Scope
모든 Unit이 공유하는 인프라, 스키마, 공통 코드를 먼저 설정

### Responsibilities
**Backend:**
- Node.js + Express + TypeScript 프로젝트 구조
- Docker Compose (Node.js + PostgreSQL)
- Prisma 전체 DB 스키마 + 마이그레이션
- 공통 모듈: `error.ts`, `response.ts`, `validation.ts`
- 미들웨어 인터페이스 정의 (auth middleware stubs)
- Express app.ts, server.ts, 라우터 등록 구조
- Seed 데이터 (매장, 관리자 계정, 테이블)

**Frontend:**
- React + Vite + TypeScript 프로젝트 구조
- 공통 컴포넌트 (Button, Modal, Loading, ConfirmDialog)
- API Client 기반 (`api/client.ts`)
- 공유 타입 정의 (`types/index.ts`)
- App.tsx 라우팅 쉘 (각 도메인 라우트 placeholder)
- 공통 스타일/레이아웃

### Deliverables
- `docker-compose.yml`
- `backend/` 프로젝트 골격
- `backend/prisma/schema.prisma`
- `backend/src/common/*`
- `backend/src/app.ts`, `backend/src/server.ts`
- `frontend/` 프로젝트 골격
- `frontend/src/components/common/*`
- `frontend/src/api/client.ts`
- `frontend/src/types/index.ts`
- `frontend/src/App.tsx`

### Exit Criteria
- Docker Compose로 서버+DB 기동
- DB 마이그레이션 성공
- FE dev server 기동
- 4명이 각자 Unit 작업 시작 가능

---

## Unit 1: Auth 도메인 (1명)

### Scope
인증/인가 전체 (관리자 로그인 + 테이블 인증 + 미들웨어)

### Backend
- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/auth.middleware.ts` (adminAuth, tableAuth)
- `src/modules/auth/auth.types.ts`
- Rate Limiting 미들웨어
- Auth 관련 단위 + 통합 테스트

### Frontend
- `src/pages/customer/LoginPage.tsx` (테이블 로그인/자동 로그인)
- `src/pages/admin/LoginPage.tsx` (관리자 로그인)
- `src/contexts/CustomerAuthContext.tsx` (API 키 토큰, 자동 로그인)
- `src/contexts/AdminAuthContext.tsx` (JWT, 16시간 세션)
- `src/api/auth.ts`

### FR Coverage
- FR-01: 테이블 태블릿 자동 로그인
- FR-06: 매장 인증 (16시간 세션)
- NFR-02: 보안 (bcrypt, JWT, rate limit)

### Exit Criteria
- 관리자 로그인 → JWT 발급 → 16시간 만료 동작
- 테이블 인증 → API 키 발급 → 자동 로그인 동작
- 인증 미들웨어로 보호된 API 접근 제어 확인
- 로그인 시도 제한 동작

---

## Unit 2: Menu 도메인 (1명)

### Scope
메뉴/카테고리 관리 전체 (관리자 CRUD + 고객 조회)

### Backend
- `src/modules/menu/menu.controller.ts`
- `src/modules/menu/menu.service.ts`
- `src/modules/menu/menu.types.ts`
- Menu 관련 단위 + 통합 테스트

### Frontend
- `src/pages/customer/MenuPage.tsx` (메뉴 조회 기본 화면)
- `src/pages/admin/MenuManagePage.tsx` (메뉴 CRUD)
- `src/components/customer/CategoryTabs.tsx`
- `src/components/customer/MenuCard.tsx`
- `src/components/admin/MenuForm.tsx`
- `src/api/menu.ts`

### FR Coverage
- FR-02: 메뉴 조회 및 탐색
- FR-09: 메뉴 관리 (CRUD, 순서 조정)

### Exit Criteria
- 카테고리 CRUD + 순서 변경 API 동작
- 메뉴 CRUD + 순서 변경 API 동작
- 고객 메뉴 조회 (카테고리별 정렬) 동작
- 프론트엔드 메뉴 페이지에서 카테고리 탐색 동작
- 관리자 메뉴 관리 페이지 CRUD 동작

---

## Unit 3: Order + SSE 도메인 (1명)

### Scope
주문 생성/조회/상태관리 + 장바구니 + 실시간 알림 + 관리자 대시보드

### Backend
- `src/modules/order/order.controller.ts`
- `src/modules/order/order.service.ts`
- `src/modules/order/order.types.ts`
- `src/modules/sse/sse.controller.ts`
- `src/modules/sse/sse.manager.ts`
- Order + SSE 관련 단위 + 통합 테스트

### Frontend
- `src/pages/customer/OrderConfirmPage.tsx` (주문 확인/생성)
- `src/pages/customer/OrderHistoryPage.tsx` (주문 내역)
- `src/pages/admin/DashboardPage.tsx` (실시간 모니터링)
- `src/components/customer/CartDrawer.tsx`
- `src/components/customer/CartItem.tsx`
- `src/components/customer/OrderSuccessModal.tsx`
- `src/components/admin/TableCard.tsx`
- `src/components/admin/OrderDetailModal.tsx`
- `src/contexts/CartContext.tsx` (localStorage)
- `src/hooks/useEventSource.ts`
- `src/api/order.ts`, `src/api/adminOrder.ts`

### FR Coverage
- FR-03: 장바구니 관리
- FR-04: 주문 생성
- FR-05: 주문 내역 조회
- FR-07: 실시간 주문 모니터링

### Exit Criteria
- 주문 생성 (세션 자동 시작) API 동작
- 주문 조회/상태변경/삭제 API 동작
- SSE 연결 후 주문 이벤트 실시간 전달
- 장바구니 localStorage 유지 동작
- 주문 성공 → 5초 표시 → 메뉴 리다이렉트
- 관리자 대시보드 그리드 표시 + 실시간 업데이트

---

## Unit 4: Table 도메인 (1명)

### Scope
테이블 CRUD + 세션 라이프사이클 + 이용완료 + 과거 내역

### Backend
- `src/modules/table/table.controller.ts`
- `src/modules/table/table.service.ts`
- `src/modules/table/table-session.service.ts`
- `src/modules/table/table.types.ts`
- Table 관련 단위 + 통합 테스트

### Frontend
- `src/pages/admin/TableManagePage.tsx` (테이블 관리)
- `src/components/admin/TableManageCard.tsx`
- `src/components/admin/OrderHistoryModal.tsx`
- `src/api/adminTable.ts`

### FR Coverage
- FR-08: 테이블 관리 (초기 설정, 주문 삭제, 이용 완료, 과거 내역)

### Exit Criteria
- 테이블 CRUD API 동작
- 이용 완료 시 주문 → OrderHistory 이동
- 세션 종료 후 주문 목록/금액 리셋
- 과거 주문 내역 조회 (날짜 필터) 동작
- 프론트엔드 테이블 관리 페이지 동작

---

## 통합 시 주의사항

### Cross-Unit 연동 포인트 (통합 시 연결)
| 연동 | From | To | 시점 |
|------|------|-----|------|
| 주문 생성 시 세션 시작 | Unit 3 (Order) | Unit 4 (TableSession) | 통합 |
| 주문 삭제 (테이블 관리에서) | Unit 4 (Table) | Unit 3 (Order) | 통합 |
| 이용 완료 시 SSE 이벤트 | Unit 4 (Table) | Unit 3 (SSE) | 통합 |
| Auth 미들웨어 적용 | Unit 1 (Auth) | Unit 2,3,4 | 통합 |

### 개발 중 독립성 확보 방법
- **Auth**: 개발 중 각 Unit은 auth middleware를 stub/bypass로 대체 가능
- **Order↔Table**: 인터페이스만 합의 후 각자 개발, 통합 시 연결
- **SSE**: Unit 3이 SSEManager를 구현, Unit 4는 통합 시 이벤트 발행 호출 추가

### 통합 단계 (모든 Unit 완료 후)
1. Auth 미들웨어를 모든 라우트에 실제 연결
2. Order→TableSession 연동 (첫 주문 시 세션 생성)
3. Table→Order 연동 (이용 완료 시 주문 이력 이동)
4. Table→SSE 연동 (이용 완료 이벤트)
5. 전체 E2E 테스트

---

## Code Organization Strategy

```
table-order/
  backend/
    src/
      modules/
        auth/          # Unit 1 담당자
        menu/          # Unit 2 담당자
        order/         # Unit 3 담당자
        sse/           # Unit 3 담당자
        table/         # Unit 4 담당자
      common/          # Foundation (공동)
      app.ts           # Foundation (라우트 등록)
      server.ts        # Foundation
    prisma/
      schema.prisma    # Foundation (공동)
    tests/
      auth/            # Unit 1
      menu/            # Unit 2
      order/           # Unit 3
      table/           # Unit 4
    package.json
    Dockerfile
  frontend/
    src/
      pages/
        customer/
          LoginPage.tsx         # Unit 1
          MenuPage.tsx          # Unit 2
          OrderConfirmPage.tsx  # Unit 3
          OrderHistoryPage.tsx  # Unit 3
        admin/
          LoginPage.tsx         # Unit 1
          DashboardPage.tsx     # Unit 3
          MenuManagePage.tsx    # Unit 2
          TableManagePage.tsx   # Unit 4
      components/
        common/                 # Foundation (공동)
        customer/
          CategoryTabs.tsx      # Unit 2
          MenuCard.tsx          # Unit 2
          CartDrawer.tsx        # Unit 3
          CartItem.tsx          # Unit 3
          OrderSuccessModal.tsx # Unit 3
        admin/
          TableCard.tsx         # Unit 3
          OrderDetailModal.tsx  # Unit 3
          MenuForm.tsx          # Unit 2
          TableManageCard.tsx   # Unit 4
          OrderHistoryModal.tsx # Unit 4
      contexts/
        CustomerAuthContext.tsx  # Unit 1
        AdminAuthContext.tsx     # Unit 1
        CartContext.tsx          # Unit 3
      hooks/
        useApi.ts               # Foundation
        useEventSource.ts       # Unit 3
      api/
        client.ts               # Foundation (공동)
        auth.ts                 # Unit 1
        menu.ts                 # Unit 2
        order.ts                # Unit 3
        adminOrder.ts           # Unit 3
        adminMenu.ts            # Unit 2
        adminTable.ts           # Unit 4
      types/
        index.ts                # Foundation (공동)
      App.tsx                   # Foundation (공동)
      main.tsx                  # Foundation
    package.json
    Dockerfile
  docker-compose.yml             # Foundation
```
