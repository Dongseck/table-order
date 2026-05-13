# Build and Test Summary — Unit 3 (Order + SSE)

## Overview

| Category | Files | Status |
|----------|-------|--------|
| Build Instructions | `build-instructions.md` | Ready |
| Unit Tests | `unit-test-instructions.md` | Ready |
| Integration Tests | `integration-test-instructions.md` | Ready |

## Quick Start

```bash
# 1. Install
cd /home/ec2-user/environment/table-order
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. DB
docker compose up -d db
cd backend && npx prisma migrate dev --name init && npx prisma db seed && cd ..

# 3. Type Check
cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit && cd ..

# 4. Unit Tests
cd backend && npm test && cd ../frontend && npm test && cd ..

# 5. Dev Servers (separate terminals)
cd backend && npm run dev
cd frontend && npm run dev
```

## Test Coverage Summary

### Backend (5 test files, ~15 test cases)
- Validation: empty orders, quantity limits, item count, duplicates
- Routing: 404 for non-existent orders
- Status: invalid transitions, missing orders
- SSE: connection establishment, content-type

### Frontend (3 test files, ~13 test cases)
- CartContext: CRUD operations, localStorage sync, limits
- OrderConfirmPage: empty state, item rendering, submit button
- DashboardPage: initial load, grid rendering

## Known Limitations
- Backend DB-dependent tests (order create success, status change success) require seeded PostgreSQL
- SSE full integration test requires manual verification (two terminals)
- Frontend tests mock API calls — real E2E requires both servers running
- Auth stub passes all requests — no auth-related failures testable until Unit 1 integration

## Definition of Done Checklist
- [ ] `npx tsc --noEmit` passes (backend)
- [ ] `npx tsc --noEmit` passes (frontend)
- [ ] `npm test` passes (backend)
- [ ] `npm test` passes (frontend)
- [ ] Manual: POST /customer/orders creates order with correct orderNumber
- [ ] Manual: SSE stream receives order:new event
- [ ] Manual: Status transition PENDING→PREPARING works
- [ ] Manual: DELETE on COMPLETED order returns 409
