# Application Design - Consolidated

## Architecture Overview

테이블오더 MVP는 **모듈형 모놀리스** 아키텍처로 설계됩니다.

```
+----------------------------------------------------------+
|                    Frontend (SPA)                          |
|  React + Vite + TypeScript                                |
|  +------------------------+  +-------------------------+  |
|  | Customer UI            |  | Admin UI                |  |
|  | /customer/*            |  | /admin/*                |  |
|  | - Menu, Cart, Orders   |  | - Dashboard, Menu Mgmt  |  |
|  | - Context + useReducer |  | - Table Mgmt, SSE       |  |
|  +------------------------+  +-------------------------+  |
+----------------------------------------------------------+
            |  REST API                    |  SSE
            v                              v
+----------------------------------------------------------+
|               Backend (Modular Monolith)                   |
|  Node.js + Express + TypeScript                           |
|  +-------------------------------------------------------+|
|  | Middleware: Auth, RateLimit, ErrorHandler, Logger      ||
|  +-------------------------------------------------------+|
|  | /api/v1/customer/*        | /api/v1/admin/*           ||
|  +-------------------------------------------------------+|
|  |  +------+  +------+  +-------+  +-------+  +-----+  ||
|  |  | Auth |  | Menu |  | Order |  | Table |  | SSE |  ||
|  |  +------+  +------+  +-------+  +-------+  +-----+  ||
|  +-------------------------------------------------------+|
|  | Service Layer (Business Logic + Orchestration)         ||
|  +-------------------------------------------------------+|
|  | Prisma ORM (Data Access)                              ||
|  +-------------------------------------------------------+|
+----------------------------------------------------------+
            |
            v
+----------------------------------------------------------+
|              PostgreSQL Database                           |
|  Tables: Store, AdminUser, Table, TableSession,           |
|          Category, MenuItem, Order, OrderItem,            |
|          OrderHistory                                     |
+----------------------------------------------------------+
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API Routing | `/api/v1/customer/*`, `/api/v1/admin/*` | 역할별 명확한 분리, 버전 관리 가능 |
| Customer Auth | API Key (storeId+tableId+password 해시) | 태블릿 자동 로그인에 적합, JWT보다 단순 |
| Admin Auth | JWT (16시간 만료) | 표준 세션 관리, stateless |
| SSE Scope | 관리자에게만 전파 | 고객은 polling으로 충분, SSE 연결 수 최소화 |
| API Response | `{ success, data, error }` 래퍼 | 클라이언트 일관된 파싱, 에러 처리 통일 |
| State Mgmt | React Context + useReducer | 외부 의존성 최소화, MVP에 적합한 복잡도 |
| Validation | Zod (input validation) | TypeScript 타입 추론 지원, 런타임 검증 |
| ORM | Prisma | Type-safe, 마이그레이션 관리, PostgreSQL 최적 |

---

## Backend Module Structure

```
src/
  modules/
    auth/
      auth.controller.ts
      auth.service.ts
      auth.middleware.ts
      auth.types.ts
    menu/
      menu.controller.ts
      menu.service.ts
      menu.types.ts
    order/
      order.controller.ts
      order.service.ts
      order.types.ts
    table/
      table.controller.ts
      table.service.ts
      table-session.service.ts
      table.types.ts
    sse/
      sse.controller.ts
      sse.manager.ts
  common/
    error.ts
    response.ts
    validation.ts
  app.ts
  server.ts
prisma/
  schema.prisma
```

---

## Frontend Structure

```
src/
  pages/
    customer/
      LoginPage.tsx
      MenuPage.tsx
      OrderConfirmPage.tsx
      OrderHistoryPage.tsx
    admin/
      LoginPage.tsx
      DashboardPage.tsx
      MenuManagePage.tsx
      TableManagePage.tsx
  components/
    customer/
      CategoryTabs.tsx
      MenuCard.tsx
      CartDrawer.tsx
      CartItem.tsx
      OrderSuccessModal.tsx
    admin/
      TableCard.tsx
      OrderDetailModal.tsx
      OrderHistoryModal.tsx
      MenuForm.tsx
    common/
      Button.tsx
      Modal.tsx
      Loading.tsx
  contexts/
    AuthContext.tsx
    CartContext.tsx
  hooks/
    useEventSource.ts
    useApi.ts
  api/
    client.ts
    auth.ts
    menu.ts
    order.ts
    table.ts
  types/
    index.ts
  App.tsx
  main.tsx
```

---

## API Endpoint Summary

### Customer Endpoints (Table Auth Required)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/customer/auth/login` | 테이블 인증 |
| GET | `/api/v1/customer/menus` | 메뉴 조회 |
| POST | `/api/v1/customer/orders` | 주문 생성 |
| GET | `/api/v1/customer/orders` | 주문 내역 |

### Admin Endpoints (JWT Auth Required)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/admin/auth/login` | 관리자 로그인 |
| GET | `/api/v1/admin/orders` | 주문 목록 |
| PATCH | `/api/v1/admin/orders/:id/status` | 상태 변경 |
| DELETE | `/api/v1/admin/orders/:id` | 주문 삭제 |
| GET | `/api/v1/admin/tables` | 테이블 목록 |
| POST | `/api/v1/admin/tables` | 테이블 등록 |
| PATCH | `/api/v1/admin/tables/:id` | 테이블 수정 |
| DELETE | `/api/v1/admin/tables/:id` | 테이블 삭제 |
| POST | `/api/v1/admin/tables/:id/complete` | 이용 완료 |
| GET | `/api/v1/admin/tables/:id/history` | 과거 내역 |
| GET | `/api/v1/admin/categories` | 카테고리 목록 |
| POST | `/api/v1/admin/categories` | 카테고리 생성 |
| PATCH | `/api/v1/admin/categories/:id` | 카테고리 수정 |
| DELETE | `/api/v1/admin/categories/:id` | 카테고리 삭제 |
| PATCH | `/api/v1/admin/categories/reorder` | 카테고리 순서 |
| GET | `/api/v1/admin/menus` | 메뉴 목록 |
| POST | `/api/v1/admin/menus` | 메뉴 등록 |
| PATCH | `/api/v1/admin/menus/:id` | 메뉴 수정 |
| DELETE | `/api/v1/admin/menus/:id` | 메뉴 삭제 |
| PATCH | `/api/v1/admin/menus/reorder` | 메뉴 순서 |
| GET | `/api/v1/admin/sse/orders` | SSE 연결 |

---

## Cross-Module Interactions

1. **주문 생성**: OrderService → TableSessionService (세션 자동 시작) → SSEManager (알림)
2. **주문 상태 변경**: OrderService → SSEManager (상태 변경 알림)
3. **주문 삭제**: OrderService → SSEManager (삭제 알림)
4. **이용 완료**: TableSessionService → Prisma (이력 이동) → SSEManager (완료 알림)

---

## Referenced Documents
- [components.md](components.md) - 상세 컴포넌트 정의
- [component-methods.md](component-methods.md) - API 메서드 시그니처
- [services.md](services.md) - 서비스 레이어 설계
- [component-dependency.md](component-dependency.md) - 의존성 및 데이터 흐름
