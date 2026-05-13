# Unit of Work - Story Map

## Functional Requirements to Unit Mapping

| FR ID | Requirement | Assigned Unit | Coverage |
|-------|-------------|--------------|----------|
| FR-01 | 테이블 태블릿 자동 로그인 | Unit 1 (Auth) | Backend + Frontend |
| FR-02 | 메뉴 조회 및 탐색 | Unit 2 (Menu) | Backend + Frontend |
| FR-03 | 장바구니 관리 | Unit 3 (Order) | Frontend only |
| FR-04 | 주문 생성 | Unit 3 (Order) | Backend + Frontend |
| FR-05 | 주문 내역 조회 | Unit 3 (Order) | Backend + Frontend |
| FR-06 | 매장 인증 | Unit 1 (Auth) | Backend + Frontend |
| FR-07 | 실시간 주문 모니터링 | Unit 3 (Order+SSE) | Backend + Frontend |
| FR-08 | 테이블 관리 | Unit 4 (Table) | Backend + Frontend |
| FR-09 | 메뉴 관리 (관리자) | Unit 2 (Menu) | Backend + Frontend |

---

## Unit-Level Feature Breakdown

### Foundation (공동 선작업)
| Feature | Priority |
|---------|----------|
| Docker Compose (Node.js + PostgreSQL) | Critical |
| Backend 프로젝트 골격 (Express + TS) | Critical |
| 전체 DB 스키마 (Prisma) | Critical |
| 공통 모듈 (error, response, validation) | Critical |
| Seed 데이터 (매장, 관리자, 테이블, 샘플 메뉴) | Critical |
| Frontend 프로젝트 골격 (Vite + TS) | Critical |
| 공통 컴포넌트 (Button, Modal, Loading, ConfirmDialog) | Critical |
| API Client 기반 | Critical |
| 공유 타입 정의 | Critical |
| App.tsx 라우팅 쉘 | Critical |

### Unit 1: Auth (담당자 A)
| Feature | FR Ref | Priority |
|---------|--------|----------|
| 관리자 로그인 API (JWT 발급) | FR-06 | Critical |
| 테이블 인증 API (API 키 발급) | FR-01 | Critical |
| Admin Auth 미들웨어 | FR-06 | Critical |
| Table Auth 미들웨어 | FR-01 | Critical |
| Rate Limiting | NFR-02-3 | Important |
| 관리자 로그인 페이지 (FE) | FR-06 | Critical |
| 테이블 로그인/자동 로그인 페이지 (FE) | FR-01 | Critical |
| CustomerAuthContext | FR-01 | Critical |
| AdminAuthContext | FR-06 | Critical |

### Unit 2: Menu (담당자 B)
| Feature | FR Ref | Priority |
|---------|--------|----------|
| 카테고리 CRUD API | FR-09 | Critical |
| 카테고리 순서 변경 API | FR-09 | Important |
| 메뉴 CRUD API | FR-09 | Critical |
| 메뉴 순서 변경 API | FR-09 | Important |
| 고객 메뉴 조회 API (카테고리별) | FR-02 | Critical |
| 고객 메뉴 페이지 (FE) | FR-02 | Critical |
| CategoryTabs 컴포넌트 | FR-02 | Critical |
| MenuCard 컴포넌트 | FR-02 | Critical |
| 관리자 메뉴 관리 페이지 (FE) | FR-09 | Critical |
| MenuForm 컴포넌트 | FR-09 | Critical |

### Unit 3: Order + SSE (담당자 C)
| Feature | FR Ref | Priority |
|---------|--------|----------|
| 주문 생성 API | FR-04 | Critical |
| 주문 조회 API (고객 세션별) | FR-05 | Critical |
| 주문 조회 API (관리자 대시보드) | FR-07 | Critical |
| 주문 상태 변경 API | FR-07 | Critical |
| 주문 삭제 API | FR-07 | Critical |
| SSE 연결 + 이벤트 브로드캐스트 | FR-07 | Critical |
| CartContext + CartDrawer (FE) | FR-03 | Critical |
| 주문 확인/생성 페이지 (FE) | FR-04 | Critical |
| OrderSuccessModal | FR-04 | Critical |
| 주문 내역 페이지 (FE) | FR-05 | Important |
| 관리자 대시보드 (FE) | FR-07 | Critical |
| TableCard, OrderDetailModal (FE) | FR-07 | Critical |
| useEventSource hook | FR-07 | Critical |

### Unit 4: Table (담당자 D)
| Feature | FR Ref | Priority |
|---------|--------|----------|
| 테이블 CRUD API | FR-08 | Critical |
| 테이블 세션 시작 로직 | FR-08 | Critical |
| 테이블 이용 완료 API (세션 종료) | FR-08 | Critical |
| 주문 이력 이동 (Order → OrderHistory) | FR-08 | Critical |
| 과거 주문 내역 조회 API | FR-08 | Important |
| 테이블 관리 페이지 (FE) | FR-08 | Critical |
| TableManageCard 컴포넌트 | FR-08 | Critical |
| OrderHistoryModal 컴포넌트 | FR-08 | Important |

---

## Completion Criteria Per Unit

| Unit | Completion Criteria |
|------|-------------------|
| Foundation | Docker 기동 + DB 마이그레이션 + FE dev server + 공통 컴포넌트 렌더링 |
| Unit 1 | 로그인 API + 미들웨어 + FE 로그인/자동로그인 동작 |
| Unit 2 | 메뉴 CRUD API + FE 메뉴 조회/관리 동작 |
| Unit 3 | 주문 CRUD + SSE + FE 장바구니/주문/대시보드 동작 |
| Unit 4 | 테이블 CRUD + 세션 종료 + FE 테이블 관리 동작 |
| 통합 | Auth 미들웨어 연결 + Order↔Table 연동 + 전체 E2E |

---

## 팀 작업 가이드

### Git Branch 전략 (권장)
```
main
  └── feature/foundation  (공동)
       ├── feature/unit-1-auth    (담당자 A)
       ├── feature/unit-2-menu    (담당자 B)
       ├── feature/unit-3-order   (담당자 C)
       └── feature/unit-4-table   (담당자 D)
```

### 충돌 방지 규칙
- 각 담당자는 자기 모듈 디렉토리만 수정
- `app.ts` (라우트 등록): Foundation에서 placeholder 제공, 통합 시 연결
- `types/index.ts`: Foundation에서 전체 타입 확정, 변경 시 팀 합의
- `schema.prisma`: Foundation에서 확정, 변경 금지

### 통합 순서
1. Unit 1 (Auth) → main 머지 (미들웨어 활성화)
2. Unit 2, 3, 4 → main 머지 (순서 무관)
3. Cross-unit 연동 코드 추가
4. 전체 E2E 테스트
