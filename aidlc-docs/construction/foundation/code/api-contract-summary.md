# Foundation — API Contract Summary

> Foundation이 직접 노출하는 엔드포인트와 Cross-Unit Stub 사용 가이드 요약.

## Foundation이 제공하는 엔드포인트

### `GET /health`
헬스 체크. 인증 불필요.

**Response 200**
```json
{ "success": true, "data": { "ok": true, "ts": "2026-05-13T..." } }
```

## 4 Units가 등록할 빈 Router

| Router | Mount path | 담당 Unit |
|--------|-----------|-----------|
| `authRouter` | `/api/v1` | Unit 1 |
| `menuRouter` | `/api/v1` | Unit 2 |
| `orderRouter` | `/api/v1` | Unit 3 |
| `sseRouter` | `/api/v1` | Unit 3 |
| `tableRouter` | `/api/v1` | Unit 4 |

각 Unit 담당자는 자기 `modules/{name}/router.ts` 파일에서 `Router.method(...)` 호출만 추가하면 자동으로 앱에 노출됩니다. **`app.ts`는 수정하지 않습니다.**

## Response/Error Envelope

모든 응답은 다음 두 형식 중 하나입니다.

### Success
```json
{ "success": true, "data": <T> }
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "UPPER_SNAKE_CODE",
    "message": "human readable",
    "details": { ... }
  }
}
```

## Common Middleware 사용법

### Validation
```ts
import { validateBody } from '../../common/validation';
import { z } from 'zod';

const Body = z.object({ name: z.string().min(1) });
router.post('/items', validateBody(Body), async (req, res) => { ... });
// req.body는 검증 + 파싱된 값
```

### Auth Stub
```ts
import { adminAuth } from '../../middlewares/auth';

router.get('/admin/tables', adminAuth, async (req, res) => {
  // req.auth.storeId === 1 (Foundation stub)
});
```

### Throw AppError
```ts
import { AppError } from '../../common/error';
import { ErrorCodes } from '../../common/error-codes';

if (!menu) throw new AppError(ErrorCodes.MENU_NOT_FOUND, 'Menu not found', 404);
```

### Rate Limit
```ts
import { loginRateLimiter } from '../../common/rate-limiter';
router.post('/admin/auth/login', loginRateLimiter, validateBody(...), handler);
```

## Cross-Unit Stub 사용 (Unit 3 ↔ Unit 4)

### Unit 3 (Order)이 첫 주문 시 세션 시작
```ts
import { tableSessionService } from '../table/table-session.service';

const { sessionId } = await tableSessionService.getOrStartActiveSession(req.auth!.tableId);
// → Foundation stub이 활성 세션 조회/생성을 실 동작으로 처리
```

### Unit 3 (Order)이 SSE 이벤트 발행
```ts
import { sseManager } from '../sse/sse.manager';

sseManager.broadcast(storeId, {
  type: 'order:new',
  data: { orderId, tableId, tableNumber, orderNumber, totalAmount, createdAt }
});
// → Foundation stub은 console 출력. Unit 3 SSE 담당자가 실제 fan-out으로 교체.
```

### Unit 4 (Table)이 이용 완료 시 주문 archive
```ts
import { prisma } from '../../common/prisma';
import { archiveSessionOrders } from '../order/order.archive';

await prisma.$transaction(async (tx) => {
  const { archivedOrders } = await archiveSessionOrders(tx, sessionId);
  await tx.tableSession.update({ where: { id: sessionId }, data: { endedAt: new Date() } });
  await tx.table.update({ where: { id: tableId }, data: { currentSessionId: null } });
});
// → Foundation이 archive 함수를 완전 구현으로 제공. 그대로 사용 가능.
```

## Path Aliases

```ts
// Backend
import type { Order } from '@shared/types/domain';
import { authRouter } from './modules/auth/router';

// Frontend
import { Button } from '@/components/common';
import type { ApiResponse } from '@shared/types/api/common';
```
