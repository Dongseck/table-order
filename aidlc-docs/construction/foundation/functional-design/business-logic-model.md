# Foundation — Business Logic Model

> Foundation이 제공하는 **공유 비즈니스 로직 모델 및 계약**. 각 Unit은 이 모델 위에서 자기 도메인 로직을 구현합니다.

---

## 1. 공통 API 응답 계약

모든 REST 엔드포인트는 다음 래퍼 구조로 응답합니다.

### Success
```json
{ "success": true, "data": <T> }
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "<UPPER_SNAKE>",
    "message": "<human readable>",
    "details": { ... } 
  }
}
```

- `details`는 선택. 주로 입력 검증 실패 시 필드별 오류를 담음.
  ```json
  { "details": { "fields": [ { "path": "price", "message": "PRICE_OUT_OF_RANGE" } ] } }
  ```
- HTTP 상태 코드는 의미에 맞게 사용 (200/201/400/401/403/404/409/500). `success: false`는 4xx/5xx와 함께 반환.

### `meta` 필드
- MVP에서는 **포함하지 않음**.

---

## 2. 표준 에러 처리 흐름

1. Controller/Service에서 비즈니스 에러는 `AppError(code, message, httpStatus, details?)` throw.
2. 전역 `errorHandler` 미들웨어가 `AppError`를 위 응답 포맷으로 변환.
3. 그 외 예상치 못한 에러는 `INTERNAL_ERROR`(500)으로 매핑하고 stack을 서버 로그에 출력.

```
[Controller] → throw AppError
[Service]    → throw AppError
              ↓
[errorHandler] → { success:false, error:{ code, message, details? } }
```

### Zod 검증 실패
- Foundation이 제공하는 `validateBody(schema)` 미들웨어가 `ZodError`를 `VALIDATION_FAILED`(400)으로 변환하고 `details.fields`에 필드별 오류 누적.

---

## 3. 인증 / 인가 모델

### 3.1 관리자 인증 (JWT)
- 입력: `{ storeCode, username, password }`
- 처리:
  1. `Store.code = storeCode` 조회
  2. `AdminUser(storeId, username)` 조회 → `bcrypt.compare(password, passwordHash)`
  3. 성공 시 JWT 발급: payload `{ sub: adminUserId, storeId, role: 'admin' }`, exp `+16h`
- 응답: `{ token, expiresAt, store: { id, code, name } }`

### 3.2 테이블 인증 (JWT API Key)
- 입력: `{ storeCode, tableNumber, password }`
- 처리:
  1. `Store.code = storeCode` 조회
  2. `Table(storeId, tableNumber)` 조회 → `bcrypt.compare(password, passwordHash)`
  3. 성공 시 JWT 발급: payload `{ storeId, tableId, role: 'table' }`, **만료 없음**
- 응답: `{ token, tableId, tableNumber }`
- 토큰은 클라이언트(localStorage)에 저장 → 이후 모든 customer API에 `Authorization: Bearer <token>` 부착

### 3.3 인증 미들웨어 인터페이스 (Foundation 제공 stub)

> **상세 stub 코드 및 교체 규칙: [cross-unit-contracts.md §2.1](./cross-unit-contracts.md#21-auth-middleware-unit-1-책임) 참조**

```ts
// 실제 검증 로직은 Unit 1 (Auth)에서 구현
adminAuth(req, res, next):  req.auth = { adminUserId, storeId, role:'admin' }
tableAuth(req, res, next):  req.auth = { storeId, tableId, role:'table' }
```
Foundation은 `Express.Request` 타입 확장(`req.auth`)과 두 미들웨어의 **실 동작 stub**(시드 관리자/테이블로 통과)을 제공. Unit 2/3/4는 그대로 import하여 사용. Unit 1이 실제 JWT 검증으로 교체.

### 3.4 로그인 시도 제한
- 인증 라우트(`/api/v1/admin/auth/login`, `/api/v1/customer/auth/login`)에 **in-memory rate limiter** 적용.
- 정책: IP+storeCode 기준 1분 5회 → 초과 시 `AUTH_TOO_MANY_ATTEMPTS`(429).
- 워크숍 MVP라 Redis 등 외부 저장소는 사용하지 않음.

---

## 4. 라우팅 구조

| 영역 | 베이스 | Auth |
|------|--------|------|
| 고객 인증 | `/api/v1/customer/auth/*` | None |
| 고객 기능 | `/api/v1/customer/*` | `tableAuth` |
| 관리자 인증 | `/api/v1/admin/auth/*` | None |
| 관리자 기능 | `/api/v1/admin/*` | `adminAuth` |
| SSE | `/api/v1/admin/sse/orders` | `adminAuth` (쿼리스트링 token 지원) |

Foundation의 `app.ts`는 위 4개 라우터 그룹을 등록하고, 각 Unit이 자기 모듈의 라우터를 거기에 mount.

---

## 4-bis. Cross-Unit Stub 계약 (병렬 개발 핵심)

> **전체 명세: [cross-unit-contracts.md](./cross-unit-contracts.md)**

4명이 서로를 기다리지 않도록 Foundation이 다음 3개의 **실 동작 Stub + 인터페이스**를 제공:

| Stub | 책임 Unit | 호출하는 Unit | Foundation 동작 |
|------|-----------|----------------|-----------------|
| `adminAuth` / `tableAuth` 미들웨어 | Unit 1 | 모든 Unit | 시드 관리자/테이블로 통과 |
| `tableSessionService.getOrStartActiveSession()` | Unit 4 | Unit 3 (Order) | Prisma로 실 동작 (조회/생성) |
| `sseManager.broadcast()` | Unit 3 | Unit 3, Unit 4 | console 출력 |
| `archiveSessionOrders(tx, sessionId)` | Foundation (공유) | Unit 4 (Table) | 완전 동작 — 그대로 사용 |

→ 각 Unit 담당자가 본인 책임 코드가 완성되기 전에도 다른 Unit이 import해서 정상 동작.

---

## 5. 주문/세션 라이프사이클 (Unit 3·4 협업 계약)

```
[고객 주문 생성]
  Order.createOrder()
    ├─ activeSession = TableSession where tableId & endedAt is null
    ├─ if !activeSession: TableSession.startSession(tableId)
    ├─ orderNumber = max(session.orders.orderNumber) + 1  (없으면 1)
    ├─ Order + OrderItem(스냅샷) 트랜잭션 INSERT
    └─ SSEManager.broadcast(storeId, 'order:new', orderPayload)

[관리자 상태 변경] → SSEManager.broadcast('order:status', ...)
[관리자 주문 삭제] → Order/OrderItem 삭제 → broadcast('order:deleted', ...)

[관리자 이용 완료]
  TableSession.completeSession(tableId)
    ├─ activeSession 조회
    ├─ 트랜잭션:
    │   ├─ Order * → OrderHistory + OrderHistoryItem 스냅샷 INSERT
    │   ├─ Order, OrderItem 삭제
    │   ├─ TableSession.endedAt = now
    │   └─ Table.currentSessionId = null
    └─ SSEManager.broadcast('table:completed', { tableId })
```

**Foundation 단계 책임**: 위 흐름을 가능하게 하는 **Prisma 스키마와 인터페이스 정의**까지. 실제 구현은 Unit 3/4.

---

## 6. SSE 이벤트 계약 (Unit 3 구현, Foundation은 인터페이스 정의)

| 이벤트명 | 페이로드(요약) | 발행 시점 |
|----------|----------------|-----------|
| `order:new` | `{ orderId, tableId, tableNumber, orderNumber, totalAmount, items, createdAt }` | 주문 생성 |
| `order:status` | `{ orderId, status }` | 상태 변경 |
| `order:deleted` | `{ orderId, tableId }` | 주문 삭제 |
| `table:completed` | `{ tableId }` | 이용 완료 |

- SSE 연결은 **매장 단위**로 fan-out (`storeId` 기준 클라이언트 풀).
- 30초 간격 `: heartbeat` 주석 라인 전송으로 연결 유지.

---

## 7. 트랜잭션 정책

| 작업 | 트랜잭션 범위 |
|------|----------------|
| 주문 생성 | (세션 생성 if needed) + Order + OrderItem |
| 상태 변경 | Order 단일 UPDATE |
| 주문 삭제 | Order + OrderItem(cascade) |
| 이용 완료 | OrderHistory + OrderHistoryItem INSERT + Order/OrderItem DELETE + Session/Table UPDATE |
| 카테고리/메뉴 reorder | 다건 UPDATE를 `prisma.$transaction([...])`로 묶기 |

---

## 8. 응답 unwrap (Frontend)

Foundation API Client(`api/client.ts`)는 다음을 자동 처리:
- `success: true`면 `data`만 반환
- `success: false`면 `throw new ApiError(code, message, status, details)`

이 덕에 호출부는 `const menu = await api.get<MenusResponse>('/customer/menus')` 형태로 단순화.

---

## 9. 시간 처리 정책 (KST 고정)

- 서버 시작 시 `process.env.TZ = 'Asia/Seoul'` 설정 (Foundation `server.ts`)
- Prisma `timestamp without time zone` 사용 → DB도 KST naive로 저장
- API 응답은 `YYYY-MM-DDTHH:mm:ss+09:00` 형태 ISO 문자열
- Frontend는 `new Date(str)` 그대로 사용 (KST→로컬 변환 안 함, 단일 지역 가정)
- 날짜 필터(`?startDate=&endDate=`)도 KST 기준 `YYYY-MM-DD` 문자열 입력

---

## 10. 외부 의존성 0 원칙

Foundation/Unit 단계 모두 다음을 **사용 안 함**:
- 메시지 큐, Redis, S3, 결제 PG, 이메일/SMS, OAuth, 헬스체크 외 모니터링 SaaS, CORS 화이트리스트 검증.

워크숍 MVP에 필수가 아닌 모든 인프라는 제거. 필요 시 Operations 단계에서 추가.
