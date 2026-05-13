# Foundation — Domain Entities

> Foundation 단계에서 정의하는 **전체 도메인 모델**입니다. 모든 Unit은 이 정의에서 출발합니다.

## 공통 규약

| 항목 | 정책 |
|------|------|
| **PK 형식** | `INT auto-increment` (Prisma `Int @id @default(autoincrement())`) |
| **타임스탬프** | DB/API/UI 모두 **KST 고정** (서버 timezone=Asia/Seoul, `timestamp without time zone`) |
| **삭제 정책** | **Hard Delete** (`OrderItem`/`OrderHistory`는 메뉴/테이블 정보를 스냅샷으로 보존) |
| **`createdAt`/`updatedAt`** | 변경 추적이 필요한 엔티티에 부착, Prisma `@default(now())` / `@updatedAt` |
| **외래키 동작** | 기본 `ON DELETE RESTRICT` — 단, 스냅샷 보존 엔티티(OrderItem, OrderHistory)는 외래키 없이 값 복사 |

---

## ER Overview

```
Store ─┬─ AdminUser (N)
       ├─ Table (N) ─── TableSession (N) ─── Order (N) ─── OrderItem (N)
       │                       │
       │                       └─ (이용완료 시) → OrderHistory (N) ─── OrderHistoryItem (N)
       ├─ Category (N) ─ MenuItem (N)
```

---

## 1. Store

매장 정보. MVP에서는 1개 매장만 시드되지만 다중 매장 확장 가능 구조.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | 매장 식별자 (로그인 시 입력, 예: `store-demo`) |
| `name` | VARCHAR(50) | NOT NULL | 매장 표시명 |
| `createdAt` | TIMESTAMP | NOT NULL | |
| `updatedAt` | TIMESTAMP | NOT NULL | |

**Index**: `code` (UNIQUE)

---

## 2. AdminUser

매장에 소속된 관리자 계정.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `storeId` | INT (FK→Store) | NOT NULL | |
| `username` | VARCHAR(30) | NOT NULL | |
| `passwordHash` | VARCHAR(100) | NOT NULL | bcrypt(cost=10) 해시 |
| `createdAt` | TIMESTAMP | NOT NULL | |
| `updatedAt` | TIMESTAMP | NOT NULL | |

**Index**: `(storeId, username)` UNIQUE

---

## 3. Table

매장의 물리적 테이블.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `storeId` | INT (FK→Store) | NOT NULL | |
| `tableNumber` | INT | NOT NULL, 1~999 | 테이블 번호 |
| `passwordHash` | VARCHAR(100) | NOT NULL | bcrypt 해시 (4~8자리 숫자) |
| `currentSessionId` | INT (FK→TableSession) | NULLABLE | 현재 활성 세션 |
| `createdAt` | TIMESTAMP | NOT NULL | |
| `updatedAt` | TIMESTAMP | NOT NULL | |

**Index**: `(storeId, tableNumber)` UNIQUE

---

## 4. TableSession

테이블 이용 1회의 라이프사이클. **첫 주문 시 자동 생성**, **이용 완료 시 종료**.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `tableId` | INT (FK→Table) | NOT NULL | |
| `startedAt` | TIMESTAMP | NOT NULL | 세션 시작 시각 |
| `endedAt` | TIMESTAMP | NULLABLE | NULL이면 활성 세션 |

**Index**: `tableId, endedAt` (활성 세션 빠른 조회)

> 세션이 종료되면 해당 세션의 모든 `Order`→`OrderHistory`로 이전 후 원본 삭제.

---

## 5. Category

매장의 메뉴 카테고리.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `storeId` | INT (FK→Store) | NOT NULL | |
| `name` | VARCHAR(30) | NOT NULL | |
| `sortOrder` | INT | NOT NULL, default 0 | 화면 노출 순서(오름차순) |
| `createdAt` | TIMESTAMP | NOT NULL | |
| `updatedAt` | TIMESTAMP | NOT NULL | |

**Index**: `(storeId, sortOrder)`

> 카테고리 삭제 시 소속 MenuItem이 1개라도 있으면 거부(`CATEGORY_HAS_ITEMS`).

---

## 6. MenuItem

메뉴 항목.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `categoryId` | INT (FK→Category) | NOT NULL | |
| `name` | VARCHAR(50) | NOT NULL | |
| `price` | INT | NOT NULL, 100~1,000,000 | 원 단위, 100원 단위 |
| `description` | VARCHAR(500) | NULLABLE | |
| `imageUrl` | VARCHAR(500) | NULLABLE | |
| `sortOrder` | INT | NOT NULL, default 0 | 카테고리 내 순서 |
| `createdAt` | TIMESTAMP | NOT NULL | |
| `updatedAt` | TIMESTAMP | NOT NULL | |

**Index**: `(categoryId, sortOrder)`

---

## 7. Order

활성 세션의 주문. 세션 종료 시 OrderHistory로 이동 후 삭제.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `sessionId` | INT (FK→TableSession) | NOT NULL | |
| `tableId` | INT (FK→Table) | NOT NULL | 빠른 조회용 비정규화 |
| `orderNumber` | INT | NOT NULL | **세션 내 순번** (1, 2, 3…) |
| `status` | VARCHAR(20) | NOT NULL | `PENDING` / `PREPARING` / `COMPLETED` |
| `totalAmount` | INT | NOT NULL, ≥0 | 결제 시점 합계(원) |
| `createdAt` | TIMESTAMP | NOT NULL | 주문 시각 |
| `updatedAt` | TIMESTAMP | NOT NULL | 상태 변경 시각 |

**Index**: `(sessionId, orderNumber)` UNIQUE, `(tableId, createdAt)`

---

## 8. OrderItem

주문에 포함된 메뉴 항목. **메뉴 정보를 스냅샷으로 보존** (이후 메뉴 변경/삭제와 무관하게 주문 시점 데이터 유지).

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `orderId` | INT (FK→Order, ON DELETE CASCADE) | NOT NULL | |
| `menuItemName` | VARCHAR(50) | NOT NULL | 주문 시점 메뉴명 (스냅샷) |
| `unitPrice` | INT | NOT NULL | 주문 시점 단가 (스냅샷) |
| `quantity` | INT | NOT NULL, 1~99 | |

> `menuItemId`는 의도적으로 저장하지 않음 — 메뉴 삭제와 분리.

---

## 9. OrderHistory

세션 종료 시 `Order` → `OrderHistory`로 이전된 영구 보관 레코드.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `tableId` | INT | NOT NULL | (FK 아닌 스냅샷; Table 삭제와 분리) |
| `tableNumber` | INT | NOT NULL | 스냅샷 |
| `sessionId` | INT | NOT NULL | (FK 아닌 스냅샷) |
| `sessionStartedAt` | TIMESTAMP | NOT NULL | |
| `sessionEndedAt` | TIMESTAMP | NOT NULL | |
| `orderNumber` | INT | NOT NULL | 원본 주문 번호 |
| `status` | VARCHAR(20) | NOT NULL | 종료 시점 상태 (보통 COMPLETED) |
| `totalAmount` | INT | NOT NULL | |
| `orderedAt` | TIMESTAMP | NOT NULL | 원본 createdAt |
| `archivedAt` | TIMESTAMP | NOT NULL, default now | |

**Index**: `(tableId, orderedAt desc)`

---

## 10. OrderHistoryItem

OrderHistory에 속한 메뉴 항목 스냅샷.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INT (PK) | auto | |
| `orderHistoryId` | INT (FK→OrderHistory, ON DELETE CASCADE) | NOT NULL | |
| `menuItemName` | VARCHAR(50) | NOT NULL | |
| `unitPrice` | INT | NOT NULL | |
| `quantity` | INT | NOT NULL | |

---

## 엔티티 ↔ Unit 매핑

| 엔티티 | 주 소유 Unit | 비고 |
|--------|---------------|------|
| Store, AdminUser | Unit 1 (Auth) | 시드 데이터로 1개 매장+1명 관리자 생성 |
| Table | Unit 4 (Table) | Foundation 시드에서 10개 생성 |
| TableSession | Unit 4 (Table) | Unit 3(Order)이 호출하여 자동 시작 |
| Category, MenuItem | Unit 2 (Menu) | Foundation 시드에서 카테고리 3 + 메뉴 9 |
| Order, OrderItem | Unit 3 (Order) | |
| OrderHistory, OrderHistoryItem | Unit 4 (Table) | 세션 종료 처리 시 생성 |

---

## TypeScript 타입 (FE↔BE 공유, `shared/types/`)

`shared/types/domain.ts`에 다음 타입을 정의하고 `@shared/*` path alias로 양쪽에서 import.

```ts
export type OrderStatus = 'PENDING' | 'PREPARING' | 'COMPLETED';

export interface Store { id: number; code: string; name: string; }
export interface AdminUser { id: number; storeId: number; username: string; }
export interface Table { id: number; storeId: number; tableNumber: number; currentSessionId: number | null; }
export interface TableSession { id: number; tableId: number; startedAt: string; endedAt: string | null; }
export interface Category { id: number; storeId: number; name: string; sortOrder: number; }
export interface MenuItem { id: number; categoryId: number; name: string; price: number; description: string | null; imageUrl: string | null; sortOrder: number; }
export interface Order { id: number; sessionId: number; tableId: number; orderNumber: number; status: OrderStatus; totalAmount: number; createdAt: string; updatedAt: string; items: OrderItem[]; }
export interface OrderItem { id: number; menuItemName: string; unitPrice: number; quantity: number; }
export interface OrderHistory { id: number; tableId: number; tableNumber: number; sessionId: number; orderNumber: number; status: OrderStatus; totalAmount: number; orderedAt: string; archivedAt: string; items: OrderHistoryItem[]; }
export interface OrderHistoryItem { id: number; menuItemName: string; unitPrice: number; quantity: number; }
```

> 시간 필드는 ISO 문자열로 직렬화되지만 **KST 기준 시각**으로 해석됩니다 (오프셋 `+09:00` 포함).
