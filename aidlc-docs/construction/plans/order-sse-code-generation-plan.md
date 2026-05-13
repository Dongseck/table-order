# Unit 3 (Order + SSE) — Code Generation Plan

## Stage
CONSTRUCTION → Code Generation (Unit: **Order + SSE**) — Part 1 (Planning)

## Unit Context
- **Unit**: Unit 3 — Order + SSE
- **FR Coverage**: FR-03, FR-04, FR-05, FR-07
- **Dependencies**: Foundation (Prisma schema, common modules, auth stub, tableSessionService stub)
- **Owned Files**: `modules/order/*`, `modules/sse/*`, `shared/types/api/order.ts`, `shared/types/events.ts`
- **Modified Foundation Files**: `error-codes.ts` (Unit 3 섹션 append only)

---

## Generation Approach

Foundation이 제공한 빈 stub (`orderRouter`, `sseRouter`, `StubSseManager`)을 실 구현으로 교체합니다. 프론트엔드는 placeholder 페이지를 실제 컴포넌트로 교체합니다. 13 Step으로 분할.

---

## Execution Steps (체크리스트)

### Step 1. Shared Types 작성
- [x] `shared/types/api/order.ts` — CreateOrderRequest, CreateOrderResponse, CustomerOrdersResponse, AdminOrdersResponse, UpdateOrderStatusRequest
- [x] `shared/types/events.ts` — SseEvent에 items 필드 추가 (order:new 이벤트 payload 보강)

**Files**: 2개 수정

---

### Step 2. Backend Order Service
- [x] `backend/src/modules/order/order.service.ts`
  - `createOrder(tableId, storeId, input)` → 메뉴 검증 + 가격 계산 + 세션 조회/생성 + 주문번호 + 트랜잭션 INSERT + SSE broadcast
  - `getCustomerOrders(tableId)` → 활성 세션 주문 조회
  - `getAdminOrders(storeId, filters?)` → 테이블별 활성 주문 그룹핑
  - `updateOrderStatus(orderId, status, storeId)` → 상태 전이 검증 + UPDATE + SSE broadcast
  - `deleteOrder(orderId, storeId)` → COMPLETED 거부 + DELETE + SSE broadcast

**Files**: 1개 생성

---

### Step 3. Backend Order Validation Schemas
- [x] `backend/src/modules/order/order.validation.ts`
  - `createOrderSchema` — items array (menuItemId, quantity), totalAmount
  - `updateStatusSchema` — status enum
  - `adminOrdersQuerySchema` — tableId?, status?

**Files**: 1개 생성

---

### Step 4. Backend Order Controller
- [x] `backend/src/modules/order/order.controller.ts`
  - 5 route handlers: createOrder, getCustomerOrders, getAdminOrders, updateStatus, deleteOrder
  - 각 handler: validateBody/Query → service 호출 → response.ok/fail

**Files**: 1개 생성

---

### Step 5. Backend Order Router 교체
- [x] `backend/src/modules/order/router.ts` — 빈 Router stub을 실 라우트로 교체
  - `POST /customer/orders` → tableAuth + validateBody + controller.createOrder
  - `GET /customer/orders` → tableAuth + controller.getCustomerOrders
  - `GET /admin/orders` → adminAuth + controller.getAdminOrders
  - `PATCH /admin/orders/:id/status` → adminAuth + validateBody + controller.updateStatus
  - `DELETE /admin/orders/:id` → adminAuth + controller.deleteOrder

**Files**: 1개 수정

---

### Step 6. Backend SSE Manager 실 구현
- [x] `backend/src/modules/sse/sse.manager.ts` — StubSseManager를 실 구현으로 교체
  - SseClient 인터페이스 (clientId, storeId, adminUserId, response, filter, connectedAt)
  - SseSubscriptionFilter (tableIds?, eventTypes?)
  - RealSseManager: addClient, removeClient, broadcast (필터 적용 fan-out)
  - heartbeat interval 30초
  - write 실패 시 자동 클라이언트 제거

**Files**: 1개 수정 (전체 교체)

---

### Step 7. Backend SSE Controller + Router
- [x] `backend/src/modules/sse/sse.controller.ts`
  - `connectSse(req, res)` — 인증(헤더 or ?token), SSE 헤더 설정, 클라이언트 등록, close 감지
- [x] `backend/src/modules/sse/router.ts` — 빈 stub을 실 라우트로 교체
  - `GET /admin/sse/orders` → sse.controller.connectSse

**Files**: 2개 (1 생성, 1 수정)

---

### Step 8. Backend Tests
- [x] `backend/tests/order/order-create.test.ts` — 주문 생성 성공 + 메뉴 미존재 + 가격 불일치 + 빈 주문
- [x] `backend/tests/order/order-query.test.ts` — 고객 주문 조회 + 관리자 주문 조회 (필터)
- [x] `backend/tests/order/order-status.test.ts` — 상태 전이 성공 + 불허 전이
- [x] `backend/tests/order/order-delete.test.ts` — 삭제 성공 + COMPLETED 삭제 거부
- [x] `backend/tests/sse/sse.test.ts` — SSE 연결 + 이벤트 수신 + 필터 적용

**Files**: 5개 생성

---

### Step 9. Frontend Shared Types & API Modules
- [x] `frontend/src/api/order.ts` — orderApi (create, getMyOrders)
- [x] `frontend/src/api/adminOrder.ts` — adminOrderApi (getAll, updateStatus, delete)

**Files**: 2개 생성

---

### Step 10. Frontend CartContext + useEventSource Hook
- [x] `frontend/src/contexts/CartContext.tsx` — CartProvider, useCart hook, localStorage 동기화
- [x] `frontend/src/hooks/useEventSource.ts` — SSE 연결/재연결/이벤트 파싱, 지수 백오프 5회

**Files**: 2개 생성

---

### Step 11. Frontend Customer Pages
- [x] `frontend/src/pages/customer/OrderConfirmPlaceholder.tsx` — placeholder를 실제 주문 확인 페이지로 교체 (동일 파일명, default export 유지 → App.tsx 수정 불필요)
- [x] `frontend/src/pages/customer/OrderHistoryPlaceholder.tsx` — placeholder를 실제 주문 내역 페이지로 교체 (동일 파일명, default export 유지)
- [x] `frontend/src/components/customer/CartDrawer.tsx` + `CartDrawer.module.css`
- [x] `frontend/src/components/customer/CartItem.tsx`
- [x] `frontend/src/components/customer/OrderSuccessModal.tsx`
- [x] `frontend/src/pages/customer/OrderConfirm.module.css`
- [x] `frontend/src/pages/customer/OrderHistory.module.css`

**Files**: 5개 생성 + 2개 수정 (placeholder 파일 내용 교체, 파일명/export 유지)

**중요**: App.tsx는 Foundation 소유이므로 수정하지 않음. placeholder 파일을 같은 경로/이름/default export로 덮어쓰기.

---

### Step 12. Frontend Admin Dashboard
- [x] `frontend/src/pages/admin/DashboardPlaceholder.tsx` — placeholder를 실제 대시보드로 교체 (동일 파일명, default export 유지)
- [x] `frontend/src/pages/admin/Dashboard.module.css`
- [x] `frontend/src/components/admin/DashboardFilter.tsx`
- [x] `frontend/src/components/admin/TableCard.tsx` + `TableCard.module.css`
- [x] `frontend/src/components/admin/OrderDetailModal.tsx`

**Files**: 4개 생성 + 1개 수정 (placeholder 내용 교체)

**중요**: App.tsx는 Foundation 소유이므로 수정하지 않음.

---

### Step 13. Frontend Tests
- [x] `frontend/src/contexts/__tests__/CartContext.test.tsx` — add/remove/updateQuantity/clear/localStorage
- [x] `frontend/src/pages/customer/__tests__/OrderConfirmPage.test.tsx` — 주문 제출 + 성공 모달
- [x] `frontend/src/pages/admin/__tests__/DashboardPage.test.tsx` — 초기 로드 + SSE 이벤트 반영

**Files**: 3개 생성

**Note**: App.tsx는 Foundation 소유이므로 수정하지 않음. placeholder 파일을 동일 경로에서 덮어쓰는 방식으로 라우트가 자동 연결됨.

---

## Story Traceability

| FR | Step | 구현 내용 |
|----|------|-----------|
| FR-03 (장바구니) | 10, 11 | CartContext + CartDrawer |
| FR-04 (주문 생성) | 1~5, 9, 11 | Backend Order API + Frontend OrderConfirmPage |
| FR-05 (주문 내역) | 2, 4, 5, 9, 11 | getCustomerOrders + OrderHistoryPage |
| FR-07 (실시간 모니터링) | 6, 7, 10, 12 | SSE Manager + DashboardPage + useEventSource |

---

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| SSE 연결이 SQLite 테스트 환경에서 복잡 | SSE 테스트는 supertest로 초기 응답 검증만, 풀 연결은 integration에서 |
| tableSessionService stub 호출 | Foundation stub이 실 동작 제공 (getOrStartActiveSession) |
| App.tsx 수정 시 다른 Unit과 충돌 | import 경로만 변경, 라우트 구조 미변경 |

---

## Definition of Done
- [ ] 모든 Step의 체크박스 [x]
- [ ] `POST /customer/orders` → 주문 생성 + SSE 이벤트 발행 동작
- [ ] `GET /customer/orders` → 활성 세션 주문 반환
- [ ] `GET /admin/orders` → 테이블별 그룹핑 응답
- [ ] `PATCH /admin/orders/:id/status` → 상태 전이 + SSE
- [ ] `DELETE /admin/orders/:id` → COMPLETED 거부 + SSE
- [ ] `GET /admin/sse/orders` → SSE 스트림 연결 + 필터 적용
- [ ] CartContext localStorage 동기화
- [ ] 프론트엔드 3개 페이지 동작 (OrderConfirm, OrderHistory, Dashboard)
- [ ] Backend 테스트 전체 통과
- [ ] Frontend 테스트 전체 통과

---

## Foundation 수정 금지 파일 (확인)
아래 파일은 **절대 수정하지 않음**:
- `backend/src/app.ts`
- `frontend/src/App.tsx`
- `backend/prisma/schema.prisma`
- `shared/types/domain.ts`
- `shared/types/api/common.ts`
- `docker-compose.yml`
- `backend/prisma/seed.ts`
- `frontend/src/components/common/*`
- `frontend/src/api/client.ts`

## Unit 3 수정 가능 파일 (cross-unit-contracts 기준)
- `backend/src/modules/order/*` (자기 모듈)
- `backend/src/modules/sse/*` (자기 모듈)
- `shared/types/api/order.ts` (자기 DTO)
- `shared/types/events.ts` (자기 책임)
- `backend/src/common/error-codes.ts` (Unit 3 섹션에 append only)
- `frontend/src/pages/customer/OrderConfirmPlaceholder.tsx` (내용 교체)
- `frontend/src/pages/customer/OrderHistoryPlaceholder.tsx` (내용 교체)
- `frontend/src/pages/admin/DashboardPlaceholder.tsx` (내용 교체)
- `frontend/src/components/customer/*` (자기 컴포넌트)
- `frontend/src/components/admin/TableCard.tsx`, `OrderDetailModal.tsx`, `DashboardFilter.tsx`
- `frontend/src/contexts/CartContext.tsx`
- `frontend/src/hooks/useEventSource.ts`
- `frontend/src/api/order.ts`, `frontend/src/api/adminOrder.ts`

## 총 파일 수
- **생성**: ~26개
- **수정**: ~5개 (router.ts ×2, sse.manager.ts, shared/types ×2) + placeholder 3개 내용 교체
- **Foundation 수정**: 0개
