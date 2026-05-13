# Integration Test Instructions — Unit 3 (Order + SSE)

## Prerequisites
- PostgreSQL running (`docker compose up -d db`)
- Database migrated and seeded (`npm run migrate && npm run seed`)

## Manual Integration Tests

### 1. 주문 생성 (POST /api/v1/customer/orders)

```bash
curl -X POST http://localhost:3000/api/v1/customer/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"menuItemId": 1, "quantity": 2},
      {"menuItemId": 4, "quantity": 1}
    ],
    "totalAmount": 24000
  }'
```

**Expected**: 201, `{ success: true, data: { order: { id, orderNumber: 1, totalAmount: 24000, status: "PENDING", createdAt } } }`

### 2. 주문 조회 - 고객 (GET /api/v1/customer/orders)

```bash
curl http://localhost:3000/api/v1/customer/orders
```

**Expected**: 200, `{ success: true, data: { orders: [...] } }`

### 3. 주문 조회 - 관리자 (GET /api/v1/admin/orders)

```bash
curl http://localhost:3000/api/v1/admin/orders
```

**Expected**: 200, `{ success: true, data: { tables: [...] } }` — 테이블별 그룹핑

### 4. 주문 상태 변경 (PATCH /api/v1/admin/orders/:id/status)

```bash
# PENDING → PREPARING
curl -X PATCH http://localhost:3000/api/v1/admin/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "PREPARING"}'
```

**Expected**: 200, status가 "PREPARING"으로 변경

```bash
# 불허 전이: PENDING → COMPLETED (스킵)
curl -X PATCH http://localhost:3000/api/v1/admin/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'
```

**Expected**: 409, ORDER_INVALID_STATUS_TRANSITION

### 5. 주문 삭제 (DELETE /api/v1/admin/orders/:id)

```bash
curl -X DELETE http://localhost:3000/api/v1/admin/orders/1
```

**Expected**: 200 (PENDING/PREPARING), 또는 409 (COMPLETED)

### 6. SSE 연결 (GET /api/v1/admin/sse/orders)

```bash
curl -N http://localhost:3000/api/v1/admin/sse/orders
```

**Expected**: 
- Content-Type: text/event-stream
- 첫 줄: `: connected`
- 30초마다: `: heartbeat`

### 7. SSE + 주문 생성 연동

터미널 1 (SSE 연결):
```bash
curl -N http://localhost:3000/api/v1/admin/sse/orders
```

터미널 2 (주문 생성):
```bash
curl -X POST http://localhost:3000/api/v1/customer/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"menuItemId": 2, "quantity": 1}], "totalAmount": 9000}'
```

**Expected**: 터미널 1에서 `event: order:new\ndata: {...}` 수신

### 8. SSE 필터링 테스트

```bash
# 테이블 1만 구독
curl -N "http://localhost:3000/api/v1/admin/sse/orders?tableIds=1"

# order:new 이벤트만 구독
curl -N "http://localhost:3000/api/v1/admin/sse/orders?eventTypes=order:new"
```

### 9. 가격 불일치 테스트

```bash
curl -X POST http://localhost:3000/api/v1/customer/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"menuItemId": 1, "quantity": 1}], "totalAmount": 99999}'
```

**Expected**: 409, ORDER_PRICE_MISMATCH

---

## Cross-Unit Integration Notes

- Auth stub이 항상 통과하므로 인증 없이 모든 API 테스트 가능
- tableSessionService stub이 실 동작하므로 첫 주문 시 세션 자동 생성 확인 가능
- Unit 4 (Table)의 이용완료 기능은 미구현이므로 `table:completed` 이벤트는 수동으로만 테스트 가능
