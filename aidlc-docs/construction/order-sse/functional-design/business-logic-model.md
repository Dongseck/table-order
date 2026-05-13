# Unit 3 (Order + SSE) — Business Logic Model

---

## 1. 주문 생성 (Customer: POST /api/v1/customer/orders)

### Input
```ts
{
  items: Array<{
    menuItemId: number;
    quantity: number;    // 1~99
  }>;
  totalAmount: number;   // 클라이언트 계산 합계 (검증용)
}
```

### Flow
```
1. tableAuth 미들웨어에서 req.auth = { tableId, storeId }
2. 입력 검증:
   - items.length: 1~50
   - 각 item.quantity: 1~99
3. 메뉴 유효성 검증:
   - items[].menuItemId로 MenuItem 조회
   - 존재하지 않으면 → ORDER_NOT_FOUND (해당 메뉴 ID 포함)
   - MenuItem.category.storeId !== req.auth.storeId → FORBIDDEN
4. 서버 가격 계산:
   - serverTotal = SUM(menuItem.price * item.quantity)
   - serverTotal !== totalAmount → ORDER_PRICE_MISMATCH
5. 세션 조회/생성:
   - tableSessionService.getOrStartActiveSession(tableId)
   - → { sessionId }
6. 주문번호 산정:
   - maxOrderNumber = MAX(Order.orderNumber WHERE sessionId) ?? 0
   - newOrderNumber = maxOrderNumber + 1
7. 트랜잭션 INSERT:
   - Order { sessionId, tableId, orderNumber, status:'PENDING', totalAmount: serverTotal }
   - OrderItem[] { menuItemName: menuItem.name, unitPrice: menuItem.price, quantity }
8. SSE 브로드캐스트:
   - sseManager.broadcast(storeId, { type:'order:new', data: { orderId, tableId, tableNumber, orderNumber, totalAmount, items, createdAt } })
9. 응답: { order: { id, orderNumber, totalAmount, status, createdAt } }
```

### Output
```ts
{ order: { id: number; orderNumber: number; totalAmount: number; status: 'PENDING'; createdAt: string } }
```

---

## 2. 주문 목록 조회 - 고객 (Customer: GET /api/v1/customer/orders)

### Flow
```
1. tableAuth → { tableId, storeId }
2. 활성 세션 조회: TableSession WHERE tableId AND endedAt IS NULL
   - 없으면 → 빈 배열 반환 (아직 주문 없음)
3. Order WHERE sessionId, ORDER BY createdAt ASC
4. 각 Order에 OrderItem[] include
5. 응답: { orders: Order[] }
```

---

## 3. 주문 목록 조회 - 관리자 (Admin: GET /api/v1/admin/orders)

### Query Params
```ts
{
  tableId?: number;    // 특정 테이블 필터
  status?: OrderStatus; // 상태 필터
}
```

### Flow
```
1. adminAuth → { storeId }
2. 활성 세션이 있는 테이블 목록 조회 (storeId 기준)
3. 각 테이블별:
   - 활성 세션의 Order 조회 (+ OrderItem)
   - 필터 적용 (tableId, status)
   - 테이블별 totalAmount 합계 계산
4. 응답: { tables: [{ tableId, tableNumber, totalAmount, orders: Order[] }] }
```

### Output
```ts
{
  tables: Array<{
    tableId: number;
    tableNumber: number;
    totalAmount: number;   // 해당 테이블의 모든 주문 합계
    orders: Array<Order & { items: OrderItem[] }>;
  }>
}
```

---

## 4. 주문 상태 변경 (Admin: PATCH /api/v1/admin/orders/:id/status)

### Input
```ts
{ status: 'PENDING' | 'PREPARING' | 'COMPLETED' }
```

### 상태 전이 규칙
```
허용:
  PENDING → PREPARING
  PREPARING → COMPLETED
  PREPARING → PENDING    (롤백)

불허 (ORDER_INVALID_STATUS_TRANSITION):
  PENDING → COMPLETED   (스킵)
  COMPLETED → *          (역전이)
```

### Flow
```
1. adminAuth → { storeId }
2. Order 조회 (id), storeId 검증 (Order→Table→storeId)
   - 없으면 → ORDER_NOT_FOUND
3. 전이 규칙 검증:
   - 현재 상태 → 요청 상태가 허용 맵에 있는지 확인
   - 불허 시 → ORDER_INVALID_STATUS_TRANSITION
4. Order.status UPDATE + updatedAt 갱신
5. SSE 브로드캐스트:
   - sseManager.broadcast(storeId, { type:'order:status', data: { orderId, status } })
6. 응답: { order: Order }
```

---

## 5. 주문 삭제 (Admin: DELETE /api/v1/admin/orders/:id)

### 삭제 조건
- PENDING, PREPARING 상태만 삭제 가능
- COMPLETED 상태 → ORDER_INVALID_STATUS_TRANSITION (삭제 불가)

### Flow
```
1. adminAuth → { storeId }
2. Order 조회 (id), storeId 검증
   - 없으면 → ORDER_NOT_FOUND
3. 상태 검증: order.status === 'COMPLETED' → 에러
4. Order DELETE (CASCADE로 OrderItem 자동 삭제)
5. SSE 브로드캐스트:
   - sseManager.broadcast(storeId, { type:'order:deleted', data: { orderId, tableId } })
6. 응답: { message: '주문이 삭제되었습니다' }
```

---

## 6. SSE 연결 (Admin: GET /api/v1/admin/sse/orders)

### Query Params
```ts
{
  token?: string;              // JWT (Authorization 헤더 대안)
  tableIds?: string;           // 콤마 구분 (예: "1,3,5") — 필터
  eventTypes?: string;         // 콤마 구분 (예: "order:new,order:status") — 필터
}
```

### Flow
```
1. 인증: Authorization 헤더 OR ?token= 에서 JWT 추출 → adminAuth 검증
   - 실패 → 401 (일반 HTTP 응답, SSE 아님)
2. SSE 헤더 설정:
   - Content-Type: text/event-stream
   - Cache-Control: no-cache
   - Connection: keep-alive
3. 클라이언트 등록:
   - clientId 생성 (UUID)
   - filter 파싱: tableIds, eventTypes → SseSubscriptionFilter
   - pool에 { clientId, storeId, adminUserId, response, filter, connectedAt } 추가
4. heartbeat 시작: 30초 간격으로 `: heartbeat\n\n` 전송
5. 연결 종료 감지: req.on('close') → pool에서 제거 + heartbeat 클리어
```

### Event Format (SSE 표준)
```
event: order:new
data: {"orderId":1,"tableId":3,"tableNumber":3,"orderNumber":1,"totalAmount":25000,"items":[...],"createdAt":"..."}

event: order:status
data: {"orderId":1,"status":"PREPARING"}

event: order:deleted
data: {"orderId":1,"tableId":3}

event: table:completed
data: {"tableId":3}
```

---

## 7. SSE Manager 내부 로직

### broadcast(storeId, event)
```
1. clients pool에서 storeId 일치하는 클라이언트 필터
2. 각 클라이언트별 구독 필터 적용:
   - filter.tableIds 설정됨 → event.data.tableId가 포함되는지 확인
   - filter.eventTypes 설정됨 → event.type이 포함되는지 확인
   - 필터 미통과 → skip
3. 필터 통과한 클라이언트에 SSE write:
   - `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
4. write 실패 (연결 끊김) → pool에서 제거
```

### 클라이언트 자동 정리
- heartbeat 전송 실패 시 pool에서 제거
- req.on('close') 이벤트로 즉시 제거

---

## 8. 프론트엔드 SSE 재연결 로직

### useEventSource Hook
```
1. SSE 연결 시도
2. 연결 성공 → 정상 이벤트 수신
3. 연결 끊김 감지 (onerror):
   - UI에 "연결 끊김" 배너 표시
   - 3초 후 자동 재연결 시도 (최대 5회, 지수 백오프: 3s, 6s, 12s, 24s, 48s)
   - 재연결 성공 시:
     - GET /admin/orders로 전체 상태 재조회
     - UI 갱신 + 배너 제거
   - 5회 실패 시:
     - "연결 실패" 배너 + "재연결" 수동 버튼 표시
```

---

## 9. 장바구니 로직 (Frontend Only)

### CartContext Actions
```
addItem(menuItem):
  - 이미 존재하면 quantity += 1 (max 99)
  - 미존재 + items.length < 50 → 추가
  - items.length >= 50 → toast.error('최대 50종류')

removeItem(menuItemId):
  - items에서 해당 항목 제거

updateQuantity(menuItemId, quantity):
  - quantity < 1 → removeItem
  - quantity > 99 → toast.error + cap at 99
  - else → 수량 변경

clearCart():
  - items = []

getTotalAmount():
  - SUM(item.price * item.quantity)

getTotalCount():
  - SUM(item.quantity)
```

### localStorage 동기화
- CartContext 상태 변경 시 즉시 `localStorage.setItem(key, JSON.stringify(state))`
- 초기 로드 시 `localStorage.getItem(key)` → parse → state 복원
- key: `cart_${storeId}_${tableId}`

### 세션 종료 시 장바구니 초기화
- `table:completed` SSE 이벤트 수신 시 (고객 측은 SSE 미사용이므로 해당 없음)
- 실제로는: 고객이 주문 성공 후 장바구니 비움 (FR-04-3)
- 이용완료 후 고객 페이지 접근 시: 세션 없음 → 빈 주문 목록 + 장바구니는 localStorage에 잔존 → 새 주문 시 새 세션 자동 생성되므로 문제 없음
- **수정**: 장바구니는 주문 성공 시에만 비움. 이용완료 이벤트는 관리자 SSE에만 도달하므로 고객 장바구니에는 영향 없음. 단, 고객이 다음 주문 시 새 세션이 자동 생성됨.

---

## 10. 트랜잭션 경계 정리

| 작업 | 트랜잭션 범위 | 격리 수준 |
|------|----------------|-----------|
| 주문 생성 | 세션 조회/생성 + Order + OrderItem | Prisma default (Read Committed) |
| 상태 변경 | Order UPDATE 단일 | 불필요 (단일 쿼리) |
| 주문 삭제 | Order DELETE (CASCADE) | 불필요 (단일 쿼리) |

> SSE broadcast는 트랜잭션 **외부**에서 실행 (커밋 후 이벤트 발행).
