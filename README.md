# 테이블오더 서비스

디지털 주문 시스템을 통해 고객에게는 편리한 주문 경험을, 매장 운영자에게는 효율적인 운영 환경을 제공하는 테이블오더 플랫폼

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express + TypeScript |
| Frontend | React + Vite + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Server-Sent Events (SSE) |
| Auth | JWT (Admin) + API Key (Table) |
| Infra | Docker + Docker Compose |

## Architecture

모듈형 모놀리스 (Modular Monolith)

```
table-order/
  backend/          # Node.js + Express + TypeScript
    src/modules/
      auth/         # Unit 1
      menu/         # Unit 2
      order/        # Unit 3
      sse/          # Unit 3
      table/        # Unit 4
    prisma/         # DB Schema
  frontend/         # React + Vite + TypeScript
    src/
      pages/customer/   # Unit 2, 3
      pages/admin/      # Unit 1, 2, 3, 4
      components/
      contexts/
  docker-compose.yml
```

## Team Structure — 4인 병렬 개발

### Development Flow

```
     Foundation (공동 선작업)
    /       |       |        \
Unit 1    Unit 2   Unit 3   Unit 4
(Auth)   (Menu)   (Order)  (Table)
  독립     독립     독립     독립
    \       |       |        /
         통합 (전원, 마지막)
```

### Branch Strategy

| Branch | 담당 | 설명 |
|--------|------|------|
| `main` | - | 안정 버전 |
| `feature/foundation` | 공동 | 프로젝트 설정, DB 스키마, 공통 코드 |
| `feature/unit-1-auth` | 담당자 A | 인증/인가 (JWT, API Key, 미들웨어, 로그인 UI) |
| `feature/unit-2-menu` | 담당자 B | 메뉴/카테고리 (CRUD API, 고객 조회 UI, 관리 UI) |
| `feature/unit-3-order` | 담당자 C | 주문 + SSE (장바구니, 주문 CRUD, 대시보드, 실시간) |
| `feature/unit-4-table` | 담당자 D | 테이블 (CRUD, 세션 관리, 이용완료, 과거내역) |

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- npm or yarn

### Development Setup
```bash
# 1. Clone
git clone https://github.com/Dongseck/table-order.git
cd table-order

# 2. Foundation 브랜치에서 시작
git checkout feature/foundation

# 3. Docker 실행
docker-compose up -d

# 4. Backend
cd backend && npm install && npm run dev

# 5. Frontend
cd frontend && npm install && npm run dev
```

## Unit별 담당 범위

### Unit 1: Auth (담당자 A)
- **FR-01**: 테이블 태블릿 자동 로그인
- **FR-06**: 매장 인증 (16시간 세션)
- 파일: `backend/src/modules/auth/*`, `frontend/src/pages/*/LoginPage.tsx`, `frontend/src/contexts/*AuthContext.tsx`

### Unit 2: Menu (담당자 B)
- **FR-02**: 메뉴 조회 및 탐색
- **FR-09**: 메뉴 관리 (CRUD, 순서 조정)
- 파일: `backend/src/modules/menu/*`, `frontend/src/pages/customer/MenuPage.tsx`, `frontend/src/pages/admin/MenuManagePage.tsx`

### Unit 3: Order + SSE (담당자 C)
- **FR-03**: 장바구니 관리
- **FR-04**: 주문 생성
- **FR-05**: 주문 내역 조회
- **FR-07**: 실시간 주문 모니터링
- 파일: `backend/src/modules/order/*`, `backend/src/modules/sse/*`, `frontend/src/pages/admin/DashboardPage.tsx`, `frontend/src/contexts/CartContext.tsx`

### Unit 4: Table (담당자 D)
- **FR-08**: 테이블 관리 (초기 설정, 이용완료, 과거내역)
- 파일: `backend/src/modules/table/*`, `frontend/src/pages/admin/TableManagePage.tsx`

## Integration (통합)

모든 Unit 완료 후:
1. Auth 미들웨어를 모든 라우트에 연결
2. Order ↔ TableSession 연동 (첫 주문 시 세션 생성)
3. Table → Order 연동 (이용 완료 시 주문 이력 이동)
4. Table → SSE 연동 (이용 완료 이벤트)
5. 전체 E2E 테스트

## 설계 문서

상세 설계 문서는 `aidlc-docs/` 디렉토리에 있습니다:
- [요구사항](aidlc-docs/inception/requirements/requirements.md)
- [Application Design](aidlc-docs/inception/application-design/application-design.md)
- [Unit of Work](aidlc-docs/inception/application-design/unit-of-work.md)
- [Unit Dependencies](aidlc-docs/inception/application-design/unit-of-work-dependency.md)
- [Story Map](aidlc-docs/inception/application-design/unit-of-work-story-map.md)
- [API Methods](aidlc-docs/inception/application-design/component-methods.md)
