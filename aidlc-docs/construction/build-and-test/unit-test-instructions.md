# Unit Test Instructions — Unit 3 (Order + SSE)

## Backend Tests

```bash
cd /home/ec2-user/environment/table-order/backend
npm test
```

### Test Files
| File | Coverage |
|------|----------|
| `tests/health.test.ts` | Foundation smoke test |
| `tests/order/order-create.test.ts` | 주문 생성 validation (빈 배열, 수량 초과, 50개 초과, totalAmount 누락, 중복 menuItemId) |
| `tests/order/order-query.test.ts` | 고객 주문 조회 + 관리자 주문 조회 (필터) |
| `tests/order/order-status.test.ts` | 상태 변경 validation + 404 |
| `tests/order/order-delete.test.ts` | 삭제 404 |
| `tests/sse/sse.test.ts` | SSE 연결 + content-type 확인 |

### Expected Results
- All validation tests pass without DB (zod schema validation at middleware level)
- Order query/status/delete tests that hit DB will require DB connection or mock
- SSE test verifies content-type header

### Notes
- Tests use `createApp()` directly (no server.listen)
- Auth stubs always pass (Foundation stub: adminUserId=1, tableId=1, storeId=1)
- Tests requiring actual DB data (menu items, orders) need seeded database

---

## Frontend Tests

```bash
cd /home/ec2-user/environment/table-order/frontend
npm test
```

### Test Files
| File | Coverage |
|------|----------|
| `src/components/common/__tests__/Button.test.tsx` | Foundation smoke test |
| `src/contexts/__tests__/CartContext.test.tsx` | CartContext: add/remove/updateQuantity/clear/localStorage/50-item limit |
| `src/pages/customer/__tests__/OrderConfirmPage.test.tsx` | 빈 장바구니 + 항목 표시 + 제출 버튼 |
| `src/pages/admin/__tests__/DashboardPage.test.tsx` | 초기 로드 + 그리드 렌더링 |

### Expected Results
- CartContext tests: 8 tests pass (pure state logic, no network)
- OrderConfirmPage tests: 3 tests pass (localStorage mock)
- DashboardPage tests: 2 tests pass (API mocked via vi.mock)
