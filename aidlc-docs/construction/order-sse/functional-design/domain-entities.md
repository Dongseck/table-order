# Unit 3 (Order + SSE) — Domain Entities

> Unit 3이 직접 조작하는 엔티티와 읽기 전용으로 참조하는 엔티티를 구분합니다.

---

## 소유 엔티티 (Unit 3 CRUD 책임)

### Order

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `sessionId` | INT (FK→TableSession) | NOT NULL | |
| `tableId` | INT (FK→Table) | NOT NULL | 비정규화 (빠른 조회용) |
| `orderNumber` | INT | NOT NULL | 세션 내 순번 (1, 2, 3…) |
| `status` | VARCHAR(20) | NOT NULL | `PENDING` / `PREPARING` / `COMPLETED` |
| `totalAmount` | INT | NOT NULL, ≥0 | 서버 계산 합계(원) |
| `createdAt` | TIMESTAMP | NOT NULL | 주문 시각 |
| `updatedAt` | TIMESTAMP | NOT NULL | 상태 변경 시각 |

**Index**: `(sessionId, orderNumber)` UNIQUE, `(tableId, createdAt)`

### OrderItem

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `orderId` | INT (FK→Order, CASCADE) | NOT NULL | |
| `menuItemName` | VARCHAR(50) | NOT NULL | 주문 시점 메뉴명 스냅샷 |
| `unitPrice` | INT | NOT NULL | 주문 시점 서버 단가 스냅샷 |
| `quantity` | INT | NOT NULL, 1~99 | |

---

## 참조 엔티티 (읽기 전용)

| 엔티티 | 사용 목적 |
|--------|-----------|
| `Table` | tableId, tableNumber, storeId 조회 |
| `TableSession` | 활성 세션 조회/생성 (stub 호출) |
| `MenuItem` | 주문 시 가격/이름 스냅샷 조회, 존재 여부 및 매장 소속 검증 |
| `Category` | MenuItem과 JOIN하여 storeId 검증 |
| `Store` | storeId 기반 SSE fan-out |

---

## SSE 관련 런타임 데이터 (비 DB)

### SSE Client Pool (In-Memory)

| 필드 | 타입 | 설명 |
|------|------|------|
| `clientId` | string | 고유 식별자 (UUID) |
| `storeId` | number | 매장 소속 |
| `adminUserId` | number | 연결한 관리자 |
| `response` | express.Response | SSE 스트림 핸들 |
| `filter` | `SseSubscriptionFilter` | 구독 필터 조건 |
| `connectedAt` | Date | 연결 시각 |

### SseSubscriptionFilter

```ts
interface SseSubscriptionFilter {
  tableIds?: number[];       // 특정 테이블만 구독 (null이면 전체)
  eventTypes?: SseEventType[]; // 특정 이벤트만 구독 (null이면 전체)
}

type SseEventType = 'order:new' | 'order:status' | 'order:deleted' | 'table:completed';
```

---

## 프론트엔드 로컬 데이터 (비 DB)

### CartItem (localStorage)

```ts
interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;       // 1~99
  imageUrl?: string;
}
```

### Cart State

```ts
interface CartState {
  items: CartItem[];      // max 50 종류
  tableId: number;
  storeId: number;
}
```

localStorage key: `cart_${storeId}_${tableId}`
