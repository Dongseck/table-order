# Component Dependencies

## Dependency Matrix

| Component | Depends On |
|-----------|-----------|
| AuthService | Prisma (AdminUser, Table) |
| MenuService | Prisma (Category, MenuItem) |
| OrderService | Prisma (Order, OrderItem), TableSessionService, SSEManager |
| TableService | Prisma (Table) |
| TableSessionService | Prisma (TableSession, Order, OrderHistory), SSEManager |
| SSEManager | (none - standalone) |

---

## Dependency Direction

```
+------------------+
|   Controllers    |  (HTTP Request Handlers)
+------------------+
        |
        v
+------------------+     +-------------------+
|   Auth Service   |     |   Menu Service    |
+------------------+     +-------------------+
        |                        |
        v                        v
+------------------+     +-------------------+
|     Prisma       |     |     Prisma        |
+------------------+     +-------------------+

+------------------+     +-------------------+
|  Order Service   |---->| TableSession Svc  |
+------------------+     +-------------------+
        |                        |
        |    +-------------+     |
        +--->| SSE Manager |<----+
        |    +-------------+
        v                        v
+------------------+     +-------------------+
|     Prisma       |     |     Prisma        |
+------------------+     +-------------------+
```

---

## Communication Patterns

### 1. Synchronous (Direct Method Call)
모든 서비스 간 통신은 동기 메서드 호출로 수행:
- OrderService → TableSessionService.startSession()
- TableSessionService → SSEManager.broadcast()
- OrderService → SSEManager.broadcast()

### 2. Event-Based (SSE to Client)
서버 → 클라이언트 단방향 이벤트:
- SSEManager → Admin Browser (SSE stream)

---

## Data Flow Diagrams

### 주문 생성 플로우
```
Customer Browser
    |
    | POST /api/v1/customer/orders
    v
OrderController
    |
    v
OrderService.createOrder()
    |
    |---> TableSessionService.startSession() [if no active session]
    |         |
    |         v
    |     Prisma: Create TableSession
    |
    |---> Prisma: Create Order + OrderItems (transaction)
    |
    |---> SSEManager.broadcast('order:new', data)
    |         |
    |         v
    |     Admin Browser (SSE event received)
    |
    v
Response: { success: true, data: { order } }
```

### 테이블 이용 완료 플로우
```
Admin Browser
    |
    | POST /api/v1/admin/tables/:id/complete
    v
TableController
    |
    v
TableSessionService.completeSession()
    |
    |---> Prisma: Find active session + orders
    |
    |---> Prisma: Copy orders to OrderHistory (transaction)
    |
    |---> Prisma: Delete original orders
    |
    |---> Prisma: Close session (endedAt, table.currentSessionId = null)
    |
    |---> SSEManager.broadcast('table:completed', data)
    |         |
    |         v
    |     Admin Browser (SSE event received)
    |
    v
Response: { success: true, data: { archivedOrders } }
```

### SSE 연결 플로우
```
Admin Browser
    |
    | GET /api/v1/admin/sse/orders (EventSource)
    v
SSEController
    |
    v
SSEManager.addClient(storeId, res)
    |
    v
Keep-alive connection (headers: text/event-stream)
    |
    |<--- heartbeat every 30s
    |<--- order:new events
    |<--- order:status events
    |<--- order:deleted events
    |<--- table:completed events
    |
    v (on disconnect)
SSEManager.removeClient(storeId, res)
```

---

## Module Independence

| Module | Can Run Independently | External Dependencies |
|--------|----------------------|----------------------|
| Auth | Yes | Prisma |
| Menu | Yes | Prisma |
| Order | No | TableSessionService, SSEManager |
| Table | Yes | Prisma |
| TableSession | No | SSEManager |
| SSE | Yes | (none) |

---

## Frontend Component Dependencies

### Customer UI State Flow
```
AuthContext (token, storeId, tableId, sessionId)
    |
    +---> MenuPage (fetches menus using storeId)
    |
    +---> CartContext (localStorage, independent)
    |         |
    |         +---> OrderConfirmPage (reads cart, creates order)
    |
    +---> OrderHistoryPage (fetches by sessionId)
```

### Admin UI State Flow
```
AuthContext (token, storeId)
    |
    +---> DashboardPage
    |         |
    |         +---> SSE connection (useEventSource hook)
    |         +---> TableCard[] (derived from order data)
    |
    +---> MenuManagePage (independent CRUD)
    |
    +---> TableManagePage (independent CRUD)
```
