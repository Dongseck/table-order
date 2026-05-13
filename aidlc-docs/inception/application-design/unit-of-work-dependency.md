# Unit of Work Dependencies

## Dependency Matrix

| Unit | Depends On | Inter-Unit Dependency |
|------|-----------|----------------------|
| Foundation | (none) | - |
| Unit 1: Auth | Foundation | 없음 (독립) |
| Unit 2: Menu | Foundation | 없음 (독립) |
| Unit 3: Order + SSE | Foundation | 없음 (독립*) |
| Unit 4: Table | Foundation | 없음 (독립*) |

> *통합 시 Unit 3↔Unit 4 연동 필요 (개발 중에는 독립)

---

## Development Model: 4인 병렬

```
         Foundation (공동 선작업, Day 1)
       /       |        |        \
  Unit 1    Unit 2    Unit 3    Unit 4
  (Auth)    (Menu)   (Order)   (Table)
  담당: A   담당: B   담당: C   담당: D
    |          |        |         |
    v          v        v         v
         통합 (전원, 마지막)
```

- **Phase 0**: Foundation 공동 설정 (전원 또는 1명 리드)
- **Phase 1**: 4개 Unit 완전 병렬 개발 (각 1명)
- **Phase 2**: 통합 + Cross-Unit 연동 + E2E 테스트

---

## 병렬 독립성 보장 방법

### 각 Unit이 독립적으로 개발 가능한 이유

| Concern | Solution |
|---------|----------|
| DB 스키마 | Foundation에서 전체 스키마 선정의 (변경 불필요) |
| Auth 미들웨어 | 개발 중 stub/mock 사용, 통합 시 실제 연결 |
| 공통 컴포넌트 | Foundation에서 선구현 |
| API Client | Foundation에서 기반 구현, 각 Unit이 도메인 API 추가 |
| 타입 정의 | Foundation에서 공유 타입 정의 |
| 라우팅 | Foundation에서 쉘 준비, 각 Unit이 자기 라우트 구현 |

### Unit 간 잠재적 연동 (개발 시 분리, 통합 시 연결)

| 연동 | 설명 | 개발 중 처리 | 통합 시 처리 |
|------|------|-------------|-------------|
| Order → TableSession | 첫 주문 시 세션 시작 | Unit 3: 세션 시작 호출을 stub | Unit 4의 실제 서비스 연결 |
| Table → Order | 이용 완료 시 주문 이동 | Unit 4: 직접 Prisma로 Order 조회/삭제 | Unit 3의 서비스 호출로 교체 가능 |
| Table → SSE | 이용 완료 이벤트 | Unit 4: SSEManager import만 | Unit 3의 SSEManager 연결 |
| Auth → All | 미들웨어 보호 | 각 Unit: middleware stub | Unit 1의 실제 미들웨어 연결 |

---

## Unit별 사용하는 DB 테이블

| Unit | Primary Tables | Read-only Access |
|------|---------------|-----------------|
| Foundation | Store (seed) | - |
| Unit 1 (Auth) | AdminUser, Table (인증 부분만) | Store |
| Unit 2 (Menu) | Category, MenuItem | Store |
| Unit 3 (Order) | Order, OrderItem | Table, TableSession |
| Unit 4 (Table) | Table, TableSession, OrderHistory | Order (이력 이동 시) |

**충돌 가능 영역:**
- `Table` 테이블: Unit 1(인증)과 Unit 4(관리) 모두 접근 → 각각 다른 필드 담당이므로 충돌 없음
- `Order` 테이블: Unit 3(생성/관리)과 Unit 4(이력이동) → 통합 시 연동

---

## Foundation이 제공하는 공유 계약

### Backend 공유 계약
```typescript
// src/common/response.ts - 모든 Unit이 사용
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

// src/common/error.ts - 모든 Unit이 사용
class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {}
}
```

### Frontend 공유 계약
```typescript
// src/api/client.ts - 모든 Unit이 사용
const apiClient = {
  get<T>(path: string): Promise<ApiResponse<T>>,
  post<T>(path: string, body: unknown): Promise<ApiResponse<T>>,
  patch<T>(path: string, body: unknown): Promise<ApiResponse<T>>,
  delete<T>(path: string): Promise<ApiResponse<T>>,
}

// src/types/index.ts - 모든 Unit이 사용
interface Store { id: string; name: string; }
interface Table { id: string; storeId: string; tableNumber: number; ... }
interface MenuItem { id: string; name: string; price: number; ... }
interface Order { id: string; orderNumber: number; status: string; ... }
// ... 전체 엔티티 타입
```

---

## Risk Points

| Risk | Mitigation |
|------|-----------|
| Foundation 작업 지연 | 1명이 리드하되 단순 작업이므로 반나절 내 완료 가능 |
| 통합 시 충돌 | 인터페이스 계약(타입, API 시그니처)을 Foundation에서 확정 |
| Auth stub→실제 전환 | middleware 인터페이스 확정, 교체만 하면 됨 |
| SSE 연동 복잡도 | SSEManager는 singleton으로 설계, import만으로 사용 가능 |
| Git 충돌 | 각 Unit이 다른 디렉토리에서 작업하므로 충돌 최소화 |
