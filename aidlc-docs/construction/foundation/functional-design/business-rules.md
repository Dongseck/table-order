# Foundation — Business Rules

> Foundation이 **상수/스키마/공통 모듈**로 강제하는 비즈니스 규칙 모음.

---

## 1. 공통 입력 검증 규칙

Foundation은 다음 Zod 스키마/상수를 `common/validation.ts`에 정의하여 모든 Unit이 재사용합니다.

| 항목 | 제약 | 에러 코드 |
|------|------|-----------|
| **메뉴 가격** | 정수, 100 ≤ price ≤ 1,000,000, `price % 100 == 0` | `PRICE_OUT_OF_RANGE` |
| **메뉴명** | 1~50자 | `INVALID_MENU_NAME` |
| **메뉴 설명** | 0~500자 | `INVALID_MENU_DESCRIPTION` |
| **카테고리명** | 1~30자 | `INVALID_CATEGORY_NAME` |
| **매장명** | 1~50자 | `INVALID_STORE_NAME` |
| **매장 코드(`code`)** | 2~50자, `^[a-z0-9-]+$` | `INVALID_STORE_CODE` |
| **테이블 번호** | 정수, 1~999 | `INVALID_TABLE_NUMBER` |
| **테이블 비밀번호** | 4~8자리 숫자 (`^\d{4,8}$`) | `INVALID_TABLE_PASSWORD` |
| **관리자 비밀번호** | 8자 이상, 영문+숫자 모두 포함 | `INVALID_ADMIN_PASSWORD` |
| **관리자 사용자명** | 3~30자, `^[a-zA-Z0-9_]+$` | `INVALID_USERNAME` |
| **주문 수량** | 정수, 1~99 | `INVALID_QUANTITY` |
| **1주문당 메뉴 종류** | 1~50개 | `ORDER_ITEMS_OUT_OF_RANGE` |
| **이미지 URL 길이** | 0~500자 | `INVALID_IMAGE_URL` |
| **이미지 URL 형식** | 비어있거나 `http://` / `https://` 시작 | `INVALID_IMAGE_URL` |
| **날짜 필터** | `YYYY-MM-DD` 형식 | `INVALID_DATE_FORMAT` |

---

## 2. 표준 에러 코드 카탈로그

`common/error-codes.ts`에 다음 상수를 정의. 컨벤션: **UPPER_SNAKE_CASE**, 첫 토큰은 도메인.

### 공통 (Foundation)
| 코드 | HTTP | 의미 |
|------|------|------|
| `VALIDATION_FAILED` | 400 | 입력 검증 실패 (details.fields) |
| `BAD_REQUEST` | 400 | 일반 요청 오류 |
| `UNAUTHORIZED` | 401 | 인증 누락/실패 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `CONFLICT` | 409 | 충돌 (예: 중복) |
| `INTERNAL_ERROR` | 500 | 예외 |

### Auth (Unit 1)
| 코드 | HTTP | 의미 |
|------|------|------|
| `AUTH_INVALID_CREDENTIALS` | 401 | 로그인 실패 |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT 만료 |
| `AUTH_TOKEN_INVALID` | 401 | JWT 위변조/형식 오류 |
| `AUTH_TOO_MANY_ATTEMPTS` | 429 | rate limit 초과 |

### Menu (Unit 2)
| 코드 | HTTP | 의미 |
|------|------|------|
| `MENU_NOT_FOUND` | 404 | |
| `CATEGORY_NOT_FOUND` | 404 | |
| `CATEGORY_HAS_ITEMS` | 409 | 메뉴 존재로 삭제 거부 |
| `DUPLICATE_CATEGORY_NAME` | 409 | (선택) |
| `PRICE_OUT_OF_RANGE` | 400 | |
| `INVALID_MENU_NAME` | 400 | |
| `INVALID_MENU_DESCRIPTION` | 400 | |
| `INVALID_CATEGORY_NAME` | 400 | |
| `INVALID_IMAGE_URL` | 400 | |

### Order (Unit 3)
| 코드 | HTTP | 의미 |
|------|------|------|
| `ORDER_NOT_FOUND` | 404 | |
| `ORDER_EMPTY` | 400 | items 비어있음 |
| `ORDER_PRICE_MISMATCH` | 409 | 클라이언트 제출 가격이 서버 가격과 다름 |
| `ORDER_INVALID_STATUS_TRANSITION` | 409 | 잘못된 상태 변경 |
| `INVALID_QUANTITY` | 400 | |
| `ORDER_ITEMS_OUT_OF_RANGE` | 400 | |

### Table (Unit 4)
| 코드 | HTTP | 의미 |
|------|------|------|
| `TABLE_NOT_FOUND` | 404 | |
| `DUPLICATE_TABLE_NUMBER` | 409 | |
| `TABLE_HAS_ACTIVE_SESSION` | 409 | 활성 세션 존재 시 삭제 거부 |
| `SESSION_NOT_FOUND` | 404 | |
| `SESSION_NOT_ACTIVE` | 409 | 종료된 세션에 작업 시도 |
| `INVALID_TABLE_NUMBER` | 400 | |
| `INVALID_TABLE_PASSWORD` | 400 | |
| `INVALID_DATE_FORMAT` | 400 | |

---

## 3. 비즈니스 룰 (도메인 무관, Foundation에서 enforce 또는 강제)

### R1. 주문 가격 검증
- 클라이언트가 `items[].menuItemId`로 주문하면 서버는 **현재 DB의 단가**로 재계산하여 `totalAmount`를 산정.
- 클라이언트가 제출한 `totalAmount`와 불일치 시 `ORDER_PRICE_MISMATCH`.
- 결과적으로 `OrderItem.unitPrice` = 서버 측 단가 스냅샷.

### R2. 주문 수량/메뉴 수 한계
- `items.length` 1~50, 각 `quantity` 1~99.

### R3. 활성 세션 1개 원칙
- 한 테이블에 동시 활성 세션은 1개만 존재 (`Table.currentSessionId`로 보장).
- 두 번째 주문은 동일 세션에 누적.

### R4. 주문 상태 전이
- `PENDING` → `PREPARING` → `COMPLETED` 만 허용.
- 역방향/스킵 시 `ORDER_INVALID_STATUS_TRANSITION` (단, MVP는 임의 변경 허용해도 무방 — Unit 3에서 정책 확정).

### R5. 메뉴 삭제 정책
- 카테고리: 소속 메뉴 존재 시 삭제 불가 (`CATEGORY_HAS_ITEMS`).
- 메뉴: 자유롭게 삭제 가능. 과거/현재 주문에는 영향 없음 (스냅샷이므로).

### R6. 테이블 삭제 정책
- 활성 세션 있으면 삭제 불가 (`TABLE_HAS_ACTIVE_SESSION`).
- 활성 세션 없으면 삭제 가능. OrderHistory는 `tableId`를 FK 없이 보유하므로 잔존.

### R7. 비밀번호 정책
- 관리자: 8자 이상, 영문+숫자 모두 포함. bcrypt(cost=10) 저장.
- 테이블: 4~8자리 숫자. bcrypt(cost=10) 저장.
- 로그인 시 평문 입력 → bcrypt.compare.

### R8. 로그인 시도 제한
- 인증 라우트 한정 in-memory rate limiter.
- key: `${clientIp}:${storeCode || 'anon'}`
- window 1분, max 5회 → 초과 시 `AUTH_TOO_MANY_ATTEMPTS`.

### R9. JWT
- 알고리즘: HS256
- 비밀키: `JWT_SECRET` 환경변수
- 관리자 만료: `16h`
- 테이블 토큰: **만료 없음** (`exp` claim 미설정)

### R10. SSE 인증
- 표준 EventSource는 헤더 부착 불가. 따라서 `/api/v1/admin/sse/orders?token=<jwt>` 쿼리스트링도 허용.
- 미들웨어가 Authorization 헤더 또는 `?token=` 중 하나에서 토큰 추출.

---

## 4. 시드(Seed) 데이터

`backend/prisma/seed.ts`가 `npx prisma db seed`로 실행됨.

### Store (1개)
```
code: "store-demo", name: "데모 매장"
```

### AdminUser (1명)
```
storeId: 1, username: "admin", password: "Admin1234!" (bcrypt)
```

### Table (10개)
- tableNumber 1~10
- 각 비밀번호: `0000` (개발 편의, 모두 동일) — *워크숍 MVP 한정*

### Category (3개)
1. 식사
2. 사이드
3. 음료

### MenuItem (9개, 카테고리당 3개)
| 카테고리 | 메뉴 | 가격 |
|----------|------|------|
| 식사 | 김치찌개 | 9,000 |
| 식사 | 된장찌개 | 9,000 |
| 식사 | 비빔밥 | 10,000 |
| 사이드 | 계란말이 | 6,000 |
| 사이드 | 김치전 | 8,000 |
| 사이드 | 잡채 | 12,000 |
| 음료 | 콜라 | 2,000 |
| 음료 | 사이다 | 2,000 |
| 음료 | 식혜 | 3,000 |

시드 실행 시 기존 데이터를 truncate 후 재삽입. 멱등 보장.

---

## 5. 환경 변수 (단순화 버전)

워크숍 MVP라 최소 4종만 유지. 나머지는 코드 상수.

### `backend/.env.example`
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/table_order
JWT_SECRET=workshop-secret-change-in-production
JWT_EXPIRES_IN=16h
PORT=3000
```

코드 상수로 처리하는 항목 (`common/constants.ts`):
- `BCRYPT_COST = 10`
- `RATE_LIMIT_LOGIN_MAX = 5`
- `RATE_LIMIT_LOGIN_WINDOW_MS = 60_000`
- `SSE_HEARTBEAT_MS = 30_000`

### CORS
- `app.use(cors())` (모든 origin 허용). 화이트리스트 없음. 워크숍 환경 한정.

### Helmet
- 미사용. 워크숍 MVP라 제외.

### Frontend (`frontend/.env.example`)
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 6. 코드 품질 / 협업 규칙

| 항목 | 정책 |
|------|------|
| **TypeScript** | strict 모드 (both FE/BE) |
| **Lint/Format** | ESLint + Prettier (FE/BE 동일 룰 셋) |
| **Pre-commit** | Husky + lint-staged → 변경 파일 lint + format 자동 |
| **Commit msg** | Conventional Commits (`feat(auth):`, `fix(menu):` 등) |
| **브랜치 전략** | `main` + Unit별 작업 브랜치 `unit/foundation`, `unit/auth`, `unit/menu`, `unit/order`, `unit/table`. 통합 시 PR. |
| **PR 리뷰** | Unit 완료 후 통합 시점에 진행 (개발 중 셀프 머지 허용) |
| **CI** | 사용 안 함 (워크숍 MVP) |

---

## 7. 테스트 정책

| 항목 | 도구 |
|------|------|
| Backend 단위/통합 | **Jest + supertest** |
| Backend 테스트 DB | **SQLite in-memory** — `prisma/test.schema.prisma`에 `provider="sqlite"` 별도 정의 후 테스트 실행 시 사용 (워크숍 MVP, 단순) |
| Frontend | **Vitest + React Testing Library** |

> SQLite 사용 시 PostgreSQL 전용 기능(예: `timestamptz`)을 피하고 표준 SQL만 사용 — 본 스키마는 이를 만족.

---

## 8. 도커 구성

`docker-compose.yml` (루트):
```
services:
  db:
    image: postgres:16
    environment: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: table_order }
    volumes: [ pgdata:/var/lib/postgresql/data ]
    ports: [ "5432:5432" ]
  backend:
    build: ./backend
    env_file: ./backend/.env
    ports: [ "3000:3000" ]
    depends_on: [ db ]
volumes:
  pgdata: {}
```

Frontend는 호스트의 `npm run dev`(Vite, 5173)로 실행 — HMR 최적.

---

## 9. 디렉토리 구조 (FR/BE/공유)

```
table-order/
├── backend/
│   ├── src/
│   │   ├── common/        # error, response, validation, constants, error-codes, prisma
│   │   ├── middlewares/   # adminAuth(stub→Unit1), tableAuth(stub→Unit1), errorHandler, rateLimiter, requestLogger
│   │   ├── modules/
│   │   │   ├── auth/   { router.ts(빈stub) }          # Unit 1
│   │   │   ├── menu/   { router.ts(빈stub) }          # Unit 2
│   │   │   ├── order/  { router.ts(빈stub), order.archive.ts(공유) }  # Unit 3 + Foundation
│   │   │   ├── sse/    { router.ts(빈stub), sse.manager.ts(stub→Unit3) }  # Unit 3
│   │   │   └── table/  { router.ts(빈stub), table-session.service.ts(stub→Unit4) }  # Unit 4
│   │   ├── app.ts                # Foundation이 모든 라우터 사전 등록 (이후 수정 금지)
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── tests/
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/common/   # Button, Modal, Loading, ConfirmDialog, Toast, Input, Select, TextArea
│   │   ├── pages/{customer,admin}/  # 각 Unit (Foundation은 placeholder만)
│   │   ├── api/client.ts
│   │   ├── contexts/            # Auth/Cart는 Unit에서
│   │   ├── hooks/useEventSource.ts (Unit 3) / useApi.ts (Foundation)
│   │   ├── App.tsx              # 라우팅 쉘
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── shared/
│   └── types/
│       ├── domain.ts            # 엔티티 타입 (Foundation)
│       ├── api/
│       │   ├── common.ts        # ApiSuccess<T>, ApiErrorBody 등 (Foundation)
│       │   ├── auth.ts          # Unit 1 DTO (Foundation은 빈 export)
│       │   ├── menu.ts          # Unit 2 DTO
│       │   ├── order.ts         # Unit 3 DTO
│       │   └── table.ts         # Unit 4 DTO
│       └── events.ts            # SSE 이벤트 타입 (Foundation이 stub, Unit 3 완성)
├── docker-compose.yml
├── package.json (워크스페이스 없음, 루트 스크립트만)
└── README.md
```

### `shared/types/` 사용
- `backend/tsconfig.json`, `frontend/tsconfig.json` 양쪽에 다음 path alias 등록:
  ```
  "paths": { "@shared/*": ["../shared/*"] }
  ```
- 양쪽에서 `import type { Order } from '@shared/types/domain'` 형태로 import.
- workspaces/turborepo 없이 단순 path alias로 공유 → 4명이 동일 타입을 사용.
