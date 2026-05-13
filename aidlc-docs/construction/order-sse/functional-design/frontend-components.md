# Unit 3 (Order + SSE) — Frontend Components

---

## 1. 컴포넌트 계층 구조

```
App.tsx (Foundation)
├── /customer/order-confirm → OrderConfirmPage
│   └── CartSummary
│       └── CartItem (반복)
├── /customer/order-history → OrderHistoryPage
│   └── OrderCard (반복)
│       └── OrderItemRow (반복)
├── /admin/dashboard → DashboardPage
│   ├── DashboardFilter
│   ├── TableCard (반복)
│   │   ├── TableCardHeader
│   │   └── OrderRow (반복)
│   └── OrderDetailModal
│       ├── OrderItemList
│       └── StatusChangeButtons
└── (floating) CartDrawer
    ├── CartDrawerItem (반복)
    └── CartFooter
```

---

## 2. Customer Pages

### 2.1 OrderConfirmPage (`pages/customer/OrderConfirmPage.tsx`)

주문 최종 확인 + 제출 페이지.

**Props**: 없음 (라우트 컴포넌트)

**State**:
```ts
{
  isSubmitting: boolean;
  showSuccess: boolean;
  orderNumber: number | null;
}
```

**동작**:
- CartContext에서 items 가져와 표시
- "주문하기" 버튼 → POST /customer/orders 호출
- 성공: showSuccess=true + orderNumber 표시 (5초) → cart.clearCart() → /customer/menu 리다이렉트
- 실패: toast.error + 장바구니 유지
- ORDER_PRICE_MISMATCH: "메뉴 가격이 변경되었습니다. 장바구니를 확인해주세요." 안내
- 장바구니 비어있으면 → /customer/menu 리다이렉트

**API**: `POST /api/v1/customer/orders`

---

### 2.2 OrderHistoryPage (`pages/customer/OrderHistoryPage.tsx`)

현재 세션의 주문 내역 조회.

**Props**: 없음

**State**:
```ts
{
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}
```

**동작**:
- 마운트 시 GET /customer/orders 호출
- 주문 시간 순(오래된 것 위) 표시
- 각 주문: 주문번호, 시각, 상태 배지, 메뉴 목록, 금액
- 세션 없으면 "아직 주문 내역이 없습니다" 표시
- Pull-to-refresh 또는 새로고침 버튼으로 갱신

**API**: `GET /api/v1/customer/orders`

---

### 2.3 CartDrawer (`components/customer/CartDrawer.tsx`)

하단에서 올라오는 장바구니 드로어. 메뉴 페이지(Unit 2)에서 사용되지만 Unit 3이 구현.

**Props**:
```ts
{
  open: boolean;
  onClose: () => void;
}
```

**State**: CartContext 사용 (별도 로컬 상태 없음)

**동작**:
- CartContext.items 렌더링
- 수량 +/- 버튼 (1~99 범위)
- 항목 삭제 (X 버튼)
- 전체 비우기 버튼 (ConfirmDialog)
- 총 금액 실시간 표시
- "주문하기" 버튼 → /customer/order-confirm 네비게이트
- 장바구니 비어있으면 "장바구니가 비어있습니다" + disabled 주문 버튼

---

### 2.4 OrderSuccessModal (`components/customer/OrderSuccessModal.tsx`)

주문 성공 시 표시하는 모달 (5초 자동 닫힘).

**Props**:
```ts
{
  open: boolean;
  orderNumber: number;
  onClose: () => void;
}
```

**동작**:
- "주문이 완료되었습니다! 주문번호: {N}" 표시
- 5초 카운트다운 표시
- 자동 닫힘 → onClose 호출 → 메뉴 페이지 리다이렉트

---

## 3. Admin Pages

### 3.1 DashboardPage (`pages/admin/DashboardPage.tsx`)

실시간 주문 모니터링 대시보드.

**Props**: 없음

**State**:
```ts
{
  tables: TableOrderData[];
  isLoading: boolean;
  sseStatus: 'connected' | 'disconnected' | 'failed';
  filter: {
    selectedTableIds: number[];  // 빈 배열 = 전체
    hideEmptyTables: boolean;
  };
  selectedOrder: Order | null;   // 모달용
}
```

**동작**:
- 마운트 시:
  1. GET /admin/orders → tables 초기화
  2. SSE 연결 (useEventSource hook)
- SSE 이벤트 수신 시 tables 상태 실시간 업데이트:
  - `order:new` → 해당 테이블에 주문 추가 + NEW 배지
  - `order:status` → 해당 주문 상태 변경
  - `order:deleted` → 해당 주문 제거 + 합계 재계산
  - `table:completed` → 해당 테이블 주문 목록 비우기
- 필터 적용:
  - selectedTableIds → 해당 테이블 카드만 표시
  - hideEmptyTables → 주문 없는 테이블 숨김
- 주문 클릭 → OrderDetailModal 열기

**API**: `GET /api/v1/admin/orders`, `GET /api/v1/admin/sse/orders`

---

### 3.2 DashboardFilter (`components/admin/DashboardFilter.tsx`)

대시보드 상단 필터 바.

**Props**:
```ts
{
  tables: Array<{ tableId: number; tableNumber: number }>;
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
}
```

**동작**:
- 테이블 멀티 선택 드롭다운 (체크박스 목록)
- "빈 테이블 숨기기" 토글 스위치
- 선택 초기화 버튼

---

### 3.3 TableCard (`components/admin/TableCard.tsx`)

대시보드의 각 테이블 카드.

**Props**:
```ts
{
  tableId: number;
  tableNumber: number;
  totalAmount: number;
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onStatusChange: (orderId: number, status: OrderStatus) => void;
}
```

**동작**:
- 헤더: 테이블 번호 + 총 주문 금액
- 주문 목록 (전체, 스크롤): 주문번호, 상태 배지, 금액
- 신규 주문: "NEW" 배지 표시 (5초 후 제거)
- 주문 클릭 → onOrderClick
- 빠른 상태 변경 버튼 (다음 상태로)

---

### 3.4 OrderDetailModal (`components/admin/OrderDetailModal.tsx`)

주문 상세 + 상태 변경 + 삭제.

**Props**:
```ts
{
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (orderId: number, status: OrderStatus) => void;
  onDelete: (orderId: number) => void;
}
```

**동작**:
- 주문 정보: 번호, 시각, 상태, 총 금액
- 메뉴 항목 목록: 이름, 수량, 단가, 소계
- 상태 변경 버튼 (허용 전이만 활성화)
- 삭제 버튼 (COMPLETED 시 disabled) → ConfirmDialog → onDelete

**API**: `PATCH /api/v1/admin/orders/:id/status`, `DELETE /api/v1/admin/orders/:id`

---

## 4. Contexts

### 4.1 CartContext (`contexts/CartContext.tsx`)

```ts
interface CartContextValue {
  items: CartItem[];
  addItem: (menuItem: { id: number; name: string; price: number; imageUrl?: string }) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalCount: number;
  itemCount: number;   // 종류 수 (items.length)
}
```

**Provider 위치**: App.tsx 내부, 라우팅 감싸기
**초기화**: localStorage에서 복원, tableId/storeId는 auth context에서 획득

---

## 5. Hooks

### 5.1 useEventSource (`hooks/useEventSource.ts`)

```ts
interface UseEventSourceOptions {
  url: string;
  token: string;
  tableIds?: number[];
  eventTypes?: SseEventType[];
  onEvent: (event: SseEvent) => void;
  onStatusChange?: (status: 'connected' | 'disconnected' | 'failed') => void;
}

function useEventSource(options: UseEventSourceOptions): {
  status: 'connected' | 'disconnected' | 'failed';
  reconnect: () => void;
}
```

**재연결 로직**:
- 끊김 감지 → 3초 후 자동 재연결 (지수 백오프: 3, 6, 12, 24, 48초)
- 최대 5회 시도
- 재연결 성공 → `onStatusChange('connected')` → 호출부가 GET 재조회
- 5회 실패 → `onStatusChange('failed')` → 수동 reconnect() 호출 대기

---

## 6. API 클라이언트 모듈

### 6.1 `api/order.ts` (Customer)

```ts
export const orderApi = {
  create(data: CreateOrderRequest): Promise<CreateOrderResponse>;
  getMyOrders(): Promise<{ orders: Order[] }>;
};
```

### 6.2 `api/adminOrder.ts` (Admin)

```ts
export const adminOrderApi = {
  getAll(params?: { tableId?: number; status?: string }): Promise<AdminOrdersResponse>;
  updateStatus(orderId: number, status: OrderStatus): Promise<{ order: Order }>;
  delete(orderId: number): Promise<{ message: string }>;
};
```

---

## 7. shared/types/api/order.ts (Unit 3 작성)

```ts
import type { OrderStatus } from '../domain';

export interface CreateOrderRequest {
  items: Array<{
    menuItemId: number;
    quantity: number;
  }>;
  totalAmount: number;
}

export interface CreateOrderResponse {
  order: {
    id: number;
    orderNumber: number;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
  };
}

export interface CustomerOrdersResponse {
  orders: Array<{
    id: number;
    orderNumber: number;
    status: OrderStatus;
    totalAmount: number;
    createdAt: string;
    items: Array<{
      id: number;
      menuItemName: string;
      unitPrice: number;
      quantity: number;
    }>;
  }>;
}

export interface AdminOrdersResponse {
  tables: Array<{
    tableId: number;
    tableNumber: number;
    totalAmount: number;
    orders: Array<{
      id: number;
      orderNumber: number;
      status: OrderStatus;
      totalAmount: number;
      createdAt: string;
      updatedAt: string;
      items: Array<{
        id: number;
        menuItemName: string;
        unitPrice: number;
        quantity: number;
      }>;
    }>;
  }>;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}
```

---

## 8. 라우트 매핑 (Foundation placeholder 교체)

| 라우트 | Foundation Placeholder | Unit 3 구현 |
|--------|------------------------|-------------|
| `/customer/order-confirm` | `OrderConfirmPlaceholder.tsx` | `OrderConfirmPage.tsx` |
| `/customer/order-history` | `OrderHistoryPlaceholder.tsx` | `OrderHistoryPage.tsx` |
| `/admin/dashboard` | `DashboardPlaceholder.tsx` | `DashboardPage.tsx` |

추가로 CartDrawer는 메뉴 페이지(Unit 2) 내에서 사용되므로, Unit 2와 통합 시 메뉴 페이지에 CartDrawer를 mount하는 방식으로 연결.

개발 중에는 Unit 3 담당자가 CartDrawer를 독립적으로 개발하고, 통합 시 Unit 2 메뉴 페이지에 import 추가.
