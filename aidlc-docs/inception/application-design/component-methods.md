# Component Methods

## Backend API Endpoints

### Auth Module

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/admin/auth/login` | 관리자 로그인 | None |
| POST | `/api/v1/customer/auth/login` | 테이블 인증 | None |

**Admin Login**
- Input: `{ storeId: string, username: string, password: string }`
- Output: `{ success: true, data: { token: string, expiresAt: string, store: StoreInfo } }`

**Table Login**
- Input: `{ storeId: string, tableNumber: number, password: string }`
- Output: `{ success: true, data: { token: string, tableId: string, tableNumber: number, sessionId: string | null } }`

---

### Menu Module

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/customer/menus` | 전체 메뉴 조회 (카테고리 포함) | Table |
| GET | `/api/v1/admin/categories` | 카테고리 목록 조회 | Admin |
| POST | `/api/v1/admin/categories` | 카테고리 생성 | Admin |
| PATCH | `/api/v1/admin/categories/:id` | 카테고리 수정 | Admin |
| DELETE | `/api/v1/admin/categories/:id` | 카테고리 삭제 | Admin |
| PATCH | `/api/v1/admin/categories/reorder` | 카테고리 순서 변경 | Admin |
| GET | `/api/v1/admin/menus` | 메뉴 목록 조회 | Admin |
| POST | `/api/v1/admin/menus` | 메뉴 등록 | Admin |
| PATCH | `/api/v1/admin/menus/:id` | 메뉴 수정 | Admin |
| DELETE | `/api/v1/admin/menus/:id` | 메뉴 삭제 | Admin |
| PATCH | `/api/v1/admin/menus/reorder` | 메뉴 순서 변경 | Admin |

**Customer Menu List**
- Input: (none, storeId from token)
- Output: `{ success: true, data: { categories: [{ id, name, sortOrder, items: [MenuItem] }] } }`

**Create Menu Item**
- Input: `{ name: string, price: number, description?: string, categoryId: string, imageUrl?: string, sortOrder?: number }`
- Output: `{ success: true, data: { menuItem: MenuItem } }`

---

### Order Module

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/customer/orders` | 주문 생성 | Table |
| GET | `/api/v1/customer/orders` | 현재 세션 주문 조회 | Table |
| GET | `/api/v1/admin/orders` | 전체 주문 조회 (대시보드) | Admin |
| PATCH | `/api/v1/admin/orders/:id/status` | 주문 상태 변경 | Admin |
| DELETE | `/api/v1/admin/orders/:id` | 주문 삭제 | Admin |

**Create Order**
- Input: `{ items: [{ menuItemId: string, name: string, quantity: number, price: number }] }`
- Output: `{ success: true, data: { order: { id, orderNumber, totalAmount, status, createdAt } } }`
- Side Effect: SSE 이벤트 발행 (관리자에게 신규 주문 알림)

**Get Orders (Customer)**
- Input: (none, tableId + sessionId from token)
- Output: `{ success: true, data: { orders: [Order] } }`

**Get Orders (Admin)**
- Input: Query params `?tableId=&status=`
- Output: `{ success: true, data: { tables: [{ tableId, tableNumber, totalAmount, orders: [Order] }] } }`

**Update Order Status**
- Input: `{ status: "pending" | "preparing" | "completed" }`
- Output: `{ success: true, data: { order: Order } }`
- Side Effect: SSE 이벤트 발행

---

### Table Module

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/admin/tables` | 테이블 목록 조회 | Admin |
| POST | `/api/v1/admin/tables` | 테이블 등록 | Admin |
| PATCH | `/api/v1/admin/tables/:id` | 테이블 수정 | Admin |
| DELETE | `/api/v1/admin/tables/:id` | 테이블 삭제 | Admin |
| POST | `/api/v1/admin/tables/:id/complete` | 이용 완료 (세션 종료) | Admin |
| GET | `/api/v1/admin/tables/:id/history` | 과거 주문 내역 | Admin |

**Complete Table Session**
- Input: (none, tableId from path)
- Output: `{ success: true, data: { message: "세션 종료 완료", archivedOrders: number } }`
- Side Effects: 현재 세션 주문을 OrderHistory로 이동, 세션 종료 시각 기록, SSE 이벤트 발행

**Get Table History**
- Input: Query params `?startDate=&endDate=`
- Output: `{ success: true, data: { history: [{ sessionId, completedAt, orders: [Order] }] } }`

---

### SSE Module

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/admin/sse/orders` | SSE 연결 | Admin |

**SSE Event Types**:
- `order:new` - 신규 주문 생성
- `order:status` - 주문 상태 변경
- `order:deleted` - 주문 삭제
- `table:completed` - 테이블 이용 완료

**SSE Event Format**:
```
event: order:new
data: { "orderId": "...", "tableNumber": 5, "totalAmount": 25000, "items": [...] }
```

---

## Middleware

| Middleware | Purpose |
|-----------|---------|
| `adminAuthMiddleware` | JWT 토큰 검증, admin 역할 확인, storeId 추출 |
| `tableAuthMiddleware` | API 키 검증, tableId/storeId/sessionId 추출 |
| `rateLimitMiddleware` | 로그인 엔드포인트 시도 제한 |
| `errorHandler` | 전역 에러 핸들링, 통일 응답 형식 반환 |
| `requestLogger` | 요청 로깅 |
