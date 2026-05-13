# Services Definition

## Service Layer Overview

서비스 레이어는 Controller(라우트 핸들러)와 데이터 액세스(Prisma) 사이에서 비즈니스 로직을 오케스트레이션합니다.

```
Controller → Service → Repository (Prisma)
                ↓
           SSE Manager (이벤트 발행)
```

---

## Service Definitions

### 1. AuthService
**Responsibility**: 인증 로직 처리

| Method | Purpose |
|--------|---------|
| `adminLogin(storeId, username, password)` | 관리자 인증 + JWT 발급 |
| `tableLogin(storeId, tableNumber, password)` | 테이블 인증 + API 키 발급 |
| `verifyAdminToken(token)` | JWT 검증 및 payload 반환 |
| `verifyTableToken(token)` | API 키 검증 및 테이블 정보 반환 |

**Interactions**:
- Prisma를 통해 AdminUser, Table 조회
- bcrypt로 비밀번호 검증
- JWT/API 키 생성

---

### 2. MenuService
**Responsibility**: 메뉴 및 카테고리 비즈니스 로직

| Method | Purpose |
|--------|---------|
| `getMenusByStore(storeId)` | 매장 전체 메뉴 (카테고리 포함, 정렬 적용) |
| `createCategory(storeId, data)` | 카테고리 생성 |
| `updateCategory(categoryId, data)` | 카테고리 수정 |
| `deleteCategory(categoryId)` | 카테고리 삭제 (메뉴 존재 시 에러) |
| `reorderCategories(storeId, orderMap)` | 카테고리 순서 변경 |
| `createMenuItem(storeId, data)` | 메뉴 등록 (검증 포함) |
| `updateMenuItem(menuItemId, data)` | 메뉴 수정 |
| `deleteMenuItem(menuItemId)` | 메뉴 삭제 |
| `reorderMenuItems(categoryId, orderMap)` | 메뉴 순서 변경 |

**Interactions**:
- Prisma를 통해 Category, MenuItem CRUD

---

### 3. OrderService
**Responsibility**: 주문 생성, 조회, 상태 관리

| Method | Purpose |
|--------|---------|
| `createOrder(storeId, tableId, sessionId, items)` | 주문 생성 + 세션 자동 시작 |
| `getOrdersBySession(sessionId)` | 현재 세션 주문 조회 |
| `getOrdersByStore(storeId, filters)` | 관리자 주문 조회 (그룹핑) |
| `updateOrderStatus(orderId, status)` | 주문 상태 변경 |
| `deleteOrder(orderId)` | 주문 삭제 |

**Interactions**:
- Prisma를 통해 Order, OrderItem CRUD
- `TableSessionService`와 협력 (첫 주문 시 세션 생성)
- `SSEManager`에 이벤트 발행 요청

**Orchestration - createOrder**:
1. 세션 존재 확인, 없으면 TableSessionService.startSession() 호출
2. Order + OrderItem 생성 (트랜잭션)
3. 주문 번호 생성
4. SSEManager.broadcast('order:new', orderData)

---

### 4. TableService
**Responsibility**: 테이블 CRUD 관리

| Method | Purpose |
|--------|---------|
| `getTablesByStore(storeId)` | 테이블 목록 조회 |
| `createTable(storeId, data)` | 테이블 등록 |
| `updateTable(tableId, data)` | 테이블 수정 |
| `deleteTable(tableId)` | 테이블 삭제 |

**Interactions**:
- Prisma를 통해 Table CRUD

---

### 5. TableSessionService
**Responsibility**: 테이블 세션 라이프사이클 관리

| Method | Purpose |
|--------|---------|
| `startSession(tableId)` | 새 세션 시작 (첫 주문 시 자동 호출) |
| `completeSession(tableId)` | 세션 종료 (이용 완료) |
| `getSessionHistory(tableId, dateRange)` | 과거 세션/주문 내역 조회 |

**Interactions**:
- Prisma를 통해 TableSession, OrderHistory CRUD
- `completeSession`: Order → OrderHistory 이동, 세션 종료 시각 기록
- `SSEManager`에 이벤트 발행 요청

**Orchestration - completeSession**:
1. 현재 활성 세션 조회
2. 세션의 모든 주문을 OrderHistory로 복사
3. 원본 주문 삭제
4. 세션 종료 시각 기록, 테이블의 currentSessionId null 처리
5. SSEManager.broadcast('table:completed', tableData)

---

### 6. SSEManager (Singleton)
**Responsibility**: SSE 연결 관리 및 이벤트 브로드캐스트

| Method | Purpose |
|--------|---------|
| `addClient(storeId, res)` | 관리자 SSE 클라이언트 등록 |
| `removeClient(storeId, res)` | 클라이언트 연결 해제 |
| `broadcast(storeId, eventType, data)` | 매장 관리자에게 이벤트 전송 |
| `heartbeat()` | 연결 유지 (30초 간격 ping) |

**Interactions**:
- HTTP Response 객체 직접 관리
- OrderService, TableSessionService에서 호출됨

---

## Cross-Cutting Concerns

### Error Handling
- 모든 서비스는 커스텀 `AppError` throw
- 전역 에러 핸들러가 `{ success: false, error: { code, message } }` 형식으로 변환

### Validation
- 입력 검증은 Controller 레이어에서 수행 (zod 또는 express-validator)
- 비즈니스 규칙 검증은 Service 레이어에서 수행

### Transaction Management
- 복합 작업(주문 생성, 세션 종료)은 Prisma 트랜잭션 사용
- 서비스 메서드 내에서 `prisma.$transaction()` 호출
