# Foundation — Cross-Unit Contracts

> **목적**: 4명(Unit 1~4)이 서로 기다리지 않고 0 충돌로 병렬 작업하도록, Foundation 단계에서 **공유 파일·인터페이스·Stub**을 미리 제공합니다.

---

## 1. 충돌 가능 파일과 분할 규칙

각 Unit 담당자가 **자기 파일만 수정**하도록 Foundation 시점에 파일을 미리 쪼개어 둡니다.

### 1.1 `shared/types/` 분할

| 파일 | 책임 Unit | Foundation 시점 |
|------|----------|------------------|
| `shared/types/domain.ts` | Foundation (이후 변경은 4명 합의) | 10개 엔티티 타입 완비 |
| `shared/types/api/auth.ts` | Unit 1 (Auth) | 빈 export `{}` |
| `shared/types/api/menu.ts` | Unit 2 (Menu) | 빈 export `{}` |
| `shared/types/api/order.ts` | Unit 3 (Order+SSE) | 빈 export `{}` |
| `shared/types/api/table.ts` | Unit 4 (Table) | 빈 export `{}` |
| `shared/types/api/common.ts` | Foundation | `ApiSuccess<T>`, `ApiError`, `Pagination` 등 |
| `shared/types/events.ts` | Unit 3 (Order+SSE) | SSE 이벤트 타입 4종 stub (이름만) |

### 1.2 Backend `app.ts` — 사전 등록

Foundation이 다음 형태로 `app.ts`를 작성하여 **각 Unit 담당자가 app.ts를 건드리지 않게** 합니다.

```ts
// backend/src/app.ts (Foundation 작성)
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import { errorHandler } from './common/error-handler';
import { authRouter }  from './modules/auth/router';     // Unit 1
import { menuRouter }  from './modules/menu/router';     // Unit 2
import { orderRouter } from './modules/order/router';    // Unit 3
import { sseRouter }   from './modules/sse/router';      // Unit 3
import { tableRouter } from './modules/table/router';    // Unit 4

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ success: true, data: { ok: true } }));

  app.use('/api/v1', authRouter);
  app.use('/api/v1', menuRouter);
  app.use('/api/v1', orderRouter);
  app.use('/api/v1', sseRouter);
  app.use('/api/v1', tableRouter);

  app.use(errorHandler);
  return app;
}
```

Foundation은 각 모듈의 `router.ts`도 **빈 라우터 stub**으로 미리 생성:

```ts
// backend/src/modules/auth/router.ts (Foundation 작성)
import { Router } from 'express';
export const authRouter = Router();
// Unit 1 담당자가 여기에 라우트를 추가 (POST /admin/auth/login 등)
```

같은 방식으로 `menu/router.ts`, `order/router.ts`, `sse/router.ts`, `table/router.ts`도 빈 Router export 제공.

### 1.3 Frontend `App.tsx` — Placeholder 사전 등록

`frontend-components.md` §2 참조. Foundation이 9개 placeholder를 모두 등록 → 각 Unit은 placeholder 컴포넌트 **파일만** 실제 구현으로 교체. `App.tsx`는 건드리지 않음.

### 1.4 `error-codes.ts` — append-only

```ts
// backend/src/common/error-codes.ts (Foundation 작성)
export const ErrorCodes = {
  // 공통 (Foundation 정의)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  // ...

  // Unit 1 (Auth) — 담당자가 자기 섹션에만 추가
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOO_MANY_ATTEMPTS: 'AUTH_TOO_MANY_ATTEMPTS',

  // Unit 2 (Menu) — 담당자가 자기 섹션에만 추가
  MENU_NOT_FOUND: 'MENU_NOT_FOUND',
  // ...
} as const;
```

규칙: 추가는 **자기 섹션 끝줄에만**. 다른 Unit 섹션 수정 금지.

---

## 2. Stub 인터페이스 (담당 Unit 미완성 시 사용)

Foundation은 다음 3개의 **임시 구현 + 인터페이스**를 제공합니다. 담당 Unit이 완성하면 import 경로 변경 없이 자동 교체됩니다.

### 2.1 Auth Middleware (Unit 1 책임)

**인터페이스** (`backend/src/middlewares/auth.ts`, Foundation 작성):
```ts
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      auth?:
        | { role: 'admin'; adminUserId: number; storeId: number }
        | { role: 'table'; tableId: number; storeId: number };
    }
  }
}

export function adminAuth(req: Request, _res: Response, next: NextFunction) {
  // Foundation stub: 항상 시드 관리자(id=1, storeId=1)로 통과
  req.auth = { role: 'admin', adminUserId: 1, storeId: 1 };
  next();
}

export function tableAuth(req: Request, _res: Response, next: NextFunction) {
  // Foundation stub: 항상 시드 테이블(id=1, storeId=1)로 통과
  req.auth = { role: 'table', tableId: 1, storeId: 1 };
  next();
}
```

- Unit 1이 실제 JWT 검증 로직으로 본 파일을 교체.
- 그동안 Unit 2/3/4는 자기 라우터에서 `adminAuth`/`tableAuth`를 정상적으로 import하여 사용 가능 — **개발 중 인증 우회 코드 따로 작성 불필요**.

### 2.2 TableSession Service (Unit 4 책임, Unit 3이 호출)

**인터페이스** (`backend/src/modules/table/table-session.service.ts`, Foundation 작성):
```ts
import { prisma } from '../../common/prisma';

export interface ITableSessionService {
  getOrStartActiveSession(tableId: number): Promise<{ sessionId: number }>;
  completeSession(tableId: number): Promise<{ archivedOrders: number }>;
}

class StubTableSessionService implements ITableSessionService {
  async getOrStartActiveSession(tableId: number) {
    // Foundation stub: 활성 세션이 없으면 생성, 있으면 반환
    const active = await prisma.tableSession.findFirst({
      where: { tableId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (active) return { sessionId: active.id };
    const created = await prisma.tableSession.create({
      data: { tableId, startedAt: new Date() },
    });
    await prisma.table.update({ where: { id: tableId }, data: { currentSessionId: created.id } });
    return { sessionId: created.id };
  }

  async completeSession(_tableId: number) {
    throw new Error('NOT_IMPLEMENTED: Unit 4 will implement');
  }
}

export const tableSessionService: ITableSessionService = new StubTableSessionService();
```

- **`getOrStartActiveSession`은 Foundation에서 실 동작하는 stub 제공** → Unit 3 (Order)이 첫 주문 시점에 호출하여 즉시 개발 가능.
- `completeSession`은 Unit 4의 핵심 책임이므로 명시적으로 미구현 throw.
- Unit 4가 완성하면 본 파일을 통째로 교체. **호출부(Unit 3)는 import 그대로**.

### 2.3 SSE Manager (Unit 3 책임, Unit 4가 호출)

**인터페이스** (`backend/src/modules/sse/sse.manager.ts`, Foundation 작성):
```ts
export type SseEvent =
  | { type: 'order:new';      data: { orderId: number; tableId: number; tableNumber: number; orderNumber: number; totalAmount: number; createdAt: string } }
  | { type: 'order:status';   data: { orderId: number; status: string } }
  | { type: 'order:deleted';  data: { orderId: number; tableId: number } }
  | { type: 'table:completed'; data: { tableId: number } };

export interface ISseManager {
  broadcast(storeId: number, event: SseEvent): void;
}

class StubSseManager implements ISseManager {
  broadcast(storeId: number, event: SseEvent) {
    // Foundation stub: 콘솔만 출력. 실제 fan-out은 Unit 3에서 구현.
    console.log(`[SSE-stub] store=${storeId}`, event.type, event.data);
  }
}

export const sseManager: ISseManager = new StubSseManager();
```

- Unit 4 (Table)이 이용완료 처리 시 `sseManager.broadcast(storeId, { type:'table:completed', ... })` 호출 가능.
- Unit 3이 실제 SSE 클라이언트 풀 관리로 본 파일 교체.

### 2.4 Order 삭제 호출 (Unit 4 → Unit 3 Order)

Unit 4 (이용완료) 처리 시 활성 세션의 Order들을 OrderHistory로 옮기고 삭제해야 합니다. Foundation은 이를 위해 **공유 트랜잭션 헬퍼**를 제공합니다.

**인터페이스** (`backend/src/modules/order/order.archive.ts`, Foundation 작성):
```ts
import type { Prisma } from '@prisma/client';

/**
 * 활성 세션의 모든 Order를 OrderHistory + OrderHistoryItem으로 스냅샷 복사하고
 * 원본 Order/OrderItem을 삭제. 호출자가 트랜잭션 컨텍스트(tx)를 제공.
 *
 * Foundation에서 실 동작하는 구현을 제공 — 두 Unit이 그대로 사용 가능.
 * Unit 3 또는 4 담당자가 필요 시 본 파일을 자기 모듈로 이동/리팩터링 가능.
 */
export async function archiveSessionOrders(
  tx: Prisma.TransactionClient,
  sessionId: number,
): Promise<{ archivedOrders: number }> {
  const session = await tx.tableSession.findUniqueOrThrow({ where: { id: sessionId } });
  const orders = await tx.order.findMany({
    where: { sessionId },
    include: { items: true },
  });
  for (const o of orders) {
    const table = await tx.table.findUniqueOrThrow({ where: { id: o.tableId } });
    await tx.orderHistory.create({
      data: {
        tableId: o.tableId,
        tableNumber: table.tableNumber,
        sessionId: o.sessionId,
        sessionStartedAt: session.startedAt,
        sessionEndedAt: session.endedAt ?? new Date(),
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        orderedAt: o.createdAt,
        items: { create: o.items.map(i => ({ menuItemName: i.menuItemName, unitPrice: i.unitPrice, quantity: i.quantity })) },
      },
    });
  }
  await tx.orderItem.deleteMany({ where: { order: { sessionId } } });
  await tx.order.deleteMany({ where: { sessionId } });
  return { archivedOrders: orders.length };
}
```

→ Unit 4 (Table.completeSession)는 `archiveSessionOrders(tx, sessionId)`만 호출. Unit 3과의 직접 의존성 0.

---

## 3. Stub 교체 시 호환성 규칙

Foundation Stub을 담당 Unit이 실제 구현으로 교체할 때:

1. **파일 경로 유지** — import 경로가 바뀌면 다른 Unit이 영향받음. 본 문서에 명시된 경로 그대로 유지.
2. **export 시그니처 유지** — 함수명, 파라미터, 반환 타입은 본 문서의 인터페이스를 충족해야 함. 추가는 가능, 제거/변경은 4명 합의 후.
3. **stub에서 발생할 수 있는 미구현 throw는 통합 시점 전까지 호출되지 않아야 함** — 예: Unit 3 개발 중 `completeSession` 호출이 일어나지 않도록 주의.

---

## 4. Cross-Unit Mock 데이터 합의

각 Unit이 개발 중 다음 시드 데이터를 **존재한다고 가정**하고 코드 작성 가능 (Foundation이 보장):

| 데이터 | 값 |
|--------|-----|
| Store id=1 | `code='store-demo'`, `name='데모 매장'` |
| AdminUser id=1 | `username='admin'`, password=`Admin1234!` |
| Table id=1~10 | `tableNumber=1~10`, password=`0000` |
| Category id=1~3 | 식사/사이드/음료 |
| MenuItem id=1~9 | 메뉴 9개 |

→ 어떤 Unit도 `Store.id=1`은 항상 존재한다고 가정 가능. stub auth가 이를 사용.

---

## 5. 작업 시작 체크리스트 (Foundation 완료 시점)

Foundation Code Generation 완료 후, 4명은 다음을 확인하고 분기:

- [ ] `git pull` 후 `npm install` (backend + frontend) 성공
- [ ] `docker compose up -d db` 후 `npm run prisma:migrate` 성공
- [ ] `npm run seed`로 시드 데이터 삽입 확인
- [ ] `npm run dev` (backend) → `http://localhost:3000/health` 200 응답
- [ ] `npm run dev` (frontend) → `http://localhost:5173`에서 placeholder 라우트 9개 확인
- [ ] 자기 Unit의 빈 `modules/{unit}/router.ts`와 placeholder 컴포넌트 위치 확인
- [ ] 다른 Unit의 stub (auth middleware, tableSessionService, sseManager, archiveSessionOrders) import 동작 확인

이 시점부터 4명은 다음을 **건드리지 않습니다**:
- `app.ts`, `App.tsx`, `schema.prisma`, `shared/types/domain.ts`, `shared/types/api/common.ts`, `docker-compose.yml`, `prisma/seed.ts`, 공통 컴포넌트, API client

각자 수정 가능한 영역:
- `modules/{unit}/*` (자기 모듈)
- `shared/types/api/{unit}.ts` (자기 DTO)
- `error-codes.ts`의 자기 섹션 (append-only)
- `pages/customer/{unit}*`, `pages/admin/{unit}*` (자기 페이지)
- `components/customer/{unit}*`, `components/admin/{unit}*` (자기 컴포넌트)
- `contexts/{unit}*Context.tsx`, `hooks/{unit}*` (자기 hook)
- `api/{unit}.ts` (자기 API 클라이언트)

---

## 6. 통합 단계 시 변경되는 파일

Foundation Stub이 실제로 교체되는 파일 목록 (통합 시 충돌 가능 영역):

| 파일 | 교체자 | 영향받는 Unit |
|------|--------|---------------|
| `middlewares/auth.ts` | Unit 1 | 모든 Unit (단, import 경로 동일) |
| `modules/table/table-session.service.ts` | Unit 4 | Unit 3 (호출자) |
| `modules/sse/sse.manager.ts` | Unit 3 | Unit 4 (호출자) |

이 3개 파일만 통합 시점에 일관성 검증 (테스트 실행) 필요. 그 외 파일은 충돌 없이 자유롭게 진행 가능.
