# Foundation - Functional Design Plan

## Stage
CONSTRUCTION → Functional Design (Unit: **Foundation**)

## Unit Scope (요약)
Foundation은 4개 병렬 Unit이 분기하기 전에 공동으로 선작업하는 **공유 토대**입니다. 비즈니스 로직 그 자체는 적지만, **모든 Unit이 의존하는 공통 도메인 모델·계약·정책**을 정의합니다.

### Foundation이 정의해야 할 "공유 함수적(Functional) 자산"
- 전체 DB 스키마 (Store, AdminUser, Table, TableSession, Category, MenuItem, Order, OrderItem, OrderHistory)
- ID 발급 정책, 타임스탬프/타임존 정책
- 공통 응답 포맷 (`{ success, data, error }`) 및 에러 코드 체계
- 공통 입력 검증 규칙(가격 범위, 문자열 길이, 비밀번호 정책 등)
- 시드 데이터 정의 (매장, 관리자, 테이블)
- API 라우트 경로 규칙 (`/api/v1/customer/*`, `/api/v1/admin/*`)
- Frontend 공통 컴포넌트 props 계약 및 API Client 인터페이스
- 공유 TypeScript 타입 정의 (FE↔BE 계약)

> 본 Functional Design은 **기술 무관**이 아니라 **Foundation의 본질상 일부 기술 결정(예: PostgreSQL/Prisma)이 이미 확정**되어 있으므로, 함수적 규칙·정책에 집중하되 ORM/DB 모델 매핑은 함께 정의합니다.

---

## Execution Plan (체크리스트)

- [x] Step 1: Unit Context 분석 (unit-of-work.md, requirements.md, application-design 산출물)
- [x] Step 2: 본 Plan 파일 생성 및 [Answer]: 태그 질문 배치
- [x] Step 3: 사용자 답변 수집
- [x] Step 4: 답변 모호성 검토 (필요 시 후속 질문 추가)
- [x] Step 5: 산출물 생성
  - [x] `aidlc-docs/construction/foundation/functional-design/domain-entities.md`
  - [x] `aidlc-docs/construction/foundation/functional-design/business-logic-model.md`
  - [x] `aidlc-docs/construction/foundation/functional-design/business-rules.md`
  - [x] `aidlc-docs/construction/foundation/functional-design/frontend-components.md` (공통 컴포넌트 한정)
  - [x] `aidlc-docs/construction/foundation/functional-design/cross-unit-contracts.md` (병목 제거 보완)
- [ ] Step 6: 완료 메시지 제시 (표준 2-옵션)
- [ ] Step 7: 사용자 승인 대기
- [ ] Step 8: audit.md 기록 + aidlc-state.md 업데이트

---

## Clarifying Questions

> 답변 방식: 각 질문 아래 `[Answer]:` 줄에 답을 적어주세요. 객관식은 알파벳(A/B/C/...) 또는 자유 서술이 가능합니다. 추천 옵션이 있으면 `A` 또는 `추천 따름`이라고만 적어도 됩니다.

---

### Q1. 식별자(ID) 정책

엔티티 PK 형식을 무엇으로 통일할까요?

- A) **cuid()** (Prisma 기본, URL-safe, 시간 정렬 가능) — *추천: 충돌 없는 분산 ID, MVP에 충분*
- B) **uuid v4** (표준성, 외부 시스템 호환)
- C) **auto-increment 정수** (간결, DB 의존)
- D) 엔티티별 혼합 (예: Order는 정수, 나머지 cuid)

[Answer]: C

---

### Q2. 주문 번호(orderNumber) 정책

`Order.orderNumber`는 화면에 노출되는 인간 친화 번호입니다. 어떤 형식으로 생성할까요?

- A) **세션 내 순번** (예: `1`, `2`, `3` — 세션 종료 시 리셋) — *추천: 고객 화면 직관성, FR-04-3과 정합*
- B) **테이블별 일일 순번** (예: `T05-001`)
- C) **매장 전체 일일 순번** (예: `20260513-001`)
- D) **UUID 짧은 형태** (예: 6자리 hash)

[Answer]: 너가 선택해줘 

---

### Q3. 타임존 / 타임스탬프 정책

타임스탬프를 DB에 어떻게 저장하고 노출할까요?

- A) **DB: UTC (timestamptz)**, **API 응답: ISO 8601 UTC**, **UI: 클라이언트 로컬 변환** — *추천: 표준*
- B) DB/API/UI 모두 KST 고정
- C) DB는 UTC, API에서 KST로 변환 후 응답

[Answer]: B

---

### Q4. Soft Delete vs Hard Delete

각 엔티티의 삭제 정책을 무엇으로 할까요? (응답에 엔티티별로 다르게 적어도 됩니다)

- A) **모두 Hard Delete** (단순, MVP 기본) — *추천 (단, OrderHistory는 보존)*
- B) **MenuItem/Category/Table은 Soft Delete** (과거 주문에서 참조 무결성 유지)
- C) **모두 Soft Delete + deletedAt 컬럼**

> 참고: 과거 주문(OrderHistory)은 메뉴/테이블이 삭제되어도 표시되어야 하므로 **OrderHistory에는 메뉴명/단가/테이블번호를 스냅샷으로 저장**하는 방식이면 Hard Delete가 가능합니다. (`OrderItem`도 동일)

[Answer]: A

---

### Q5. 공통 API 응답 포맷 세부

`{ success, data, error }` 래퍼를 사용하기로 결정되어 있습니다. 추가로 결정할 사항:

5-1) 성공 응답에 `meta` (요청ID, 처리시간 등) 필드를 포함할까요?
- A) 포함 안 함 (MVP 최소) — *추천*
- B) `requestId`만 포함
- C) `requestId` + 페이지네이션 메타 (`page`, `total` 등) 표준화

[Answer]: A

5-2) 에러 응답의 `error` 객체 구조:
- A) `{ code: string, message: string }` — *추천: 단순*
- B) `{ code: string, message: string, details?: any }` (검증 실패 시 필드별 detail)
- C) `{ code, message, details, traceId }`

[Answer]: B

---

### Q6. 표준 에러 코드 체계

에러 코드 네이밍 컨벤션을 어떻게 할까요?

- A) **SCREAMING_SNAKE** (예: `AUTH_INVALID_CREDENTIALS`, `MENU_NOT_FOUND`, `VALIDATION_FAILED`) — *추천*
- B) **dot.notation** (예: `auth.invalid_credentials`)
- C) **HTTP status code 문자열** (예: `401`, `404`)

> Foundation에서 표준 에러 코드 목록을 한 곳에 모아 정의하는 것을 권장합니다(예: `common/error-codes.ts`).

[Answer]: A

---

### Q7. 공통 입력 검증 규칙 (Business Rules)

다음 공통 검증 룰을 Foundation에서 통일된 상수/스키마로 정의합니다. 값이 적절한지 확인해주세요:

| 항목 | 제안값 | 동의 여부 |
|------|--------|-----------|
| 메뉴 가격 범위 | 100원 ~ 1,000,000원, 100원 단위 | |
| 메뉴명 길이 | 1~50자 | |
| 메뉴 설명 길이 | 0~500자 | |
| 카테고리명 길이 | 1~30자 | |
| 매장명 길이 | 1~50자 | |
| 테이블 번호 | 1~999 (정수) | |
| 테이블 비밀번호 | 4~8자리 숫자 | |
| 관리자 비밀번호 | 8자 이상, 영문+숫자 조합 | |
| 주문 수량 | 1~99 | |
| 1주문당 최대 메뉴 수 | 50개 | |
| 이미지 URL 길이 | 0~500자 | |

전체 동의/일부 수정 여부 자유롭게 적어주세요.

[Answer]: 워크숍이고 mvp를 만드는데 초점이 있는 시간이야. 맞춰서 너가 적절하게 해줘.

---

### Q8. 인증 자격증명 정책

8-1) **관리자 비밀번호 해싱 라운드** (bcrypt cost factor):
- A) 10 (기본, 빠름) — *추천: MVP*
- B) 12 (느리지만 보안 강화)

[Answer]: A

8-2) **테이블 비밀번호 해싱**:
- A) bcrypt 해싱 — *추천: 관리자와 동일 정책*
- B) 평문 저장 (관리자만 보는 값)
- C) sha256 해싱

[Answer]: A

8-3) **API 키(테이블 토큰) 형식**:
- A) **JWT** (storeId, tableId, sessionId payload) — *추천: 통일성*
- B) **랜덤 hex 문자열** + DB 저장
- C) **HMAC 서명된 short token**

[Answer]: A

8-4) **API 키 만료 정책**:
- A) **무기한** (태블릿 자동로그인 UX 우선) — *추천: FR-01과 정합*
- B) 30일 만료 후 재발급
- C) 세션 종료 시 폐기

[Answer]: A

---

### Q9. 시드(Seed) 데이터

MVP 개발/시연용 초기 데이터를 어떻게 구성할까요?

- A) **최소 시드**: 매장 1개, 관리자 1명, 테이블 10개, 카테고리 3개, 메뉴 9개 — *추천: 개발/데모 충분*
- B) **풍부 시드**: 매장 1개, 관리자 2명, 테이블 30개, 카테고리 6개, 메뉴 30개+
- C) **시드 없음**: 첫 실행 시 관리자 회원가입 화면 표시

기본 관리자 계정 정보:
- 매장 ID: `store-demo` / 사용자명: `admin` / 비밀번호: `Admin1234!`
- 위 기본값 사용 여부:

[Answer]: A

---

### Q10. 환경 변수 정책

`.env` / `.env.example`에 포함할 환경 변수와 기본값을 정의합니다.

| 변수 | 용도 | 기본값 제안 |
|------|------|-------------|
| `DATABASE_URL` | PostgreSQL 연결 | `postgresql://postgres:postgres@db:5432/table_order` |
| `JWT_SECRET` | JWT 서명 비밀키 | 개발용 placeholder, prod는 외부 주입 |
| `JWT_EXPIRES_IN` | 관리자 JWT 만료 | `16h` |
| `BCRYPT_COST` | bcrypt cost | `10` |
| `RATE_LIMIT_LOGIN_MAX` | 로그인 시도 제한 횟수 | `5` |
| `RATE_LIMIT_LOGIN_WINDOW_MS` | 시도 제한 윈도우 | `60000` (1분) |
| `NODE_ENV` | 환경 구분 | `development` |
| `PORT` | 서버 포트 | `3000` |
| `FRONTEND_URL` | CORS 허용 origin | `http://localhost:5173` |
| `SSE_HEARTBEAT_MS` | SSE 헬스체크 간격 | `30000` |

전체 동의/추가/수정 여부 적어주세요.

[Answer]: 귀찮거나 에러 발생할 수 있는 환경은 다 제거해, 위에도 말했지만 워크숍이고 mvp야 복잡한거나 애매하게 되는 설정은 다 제거해(예를 들어서 CORS는 현재 테스트니 의미 없어)

---

### Q11. 로깅 / 옵저버빌리티 (Foundation 수준)

- A) **console.log + morgan(HTTP 액세스 로그)** — *추천: MVP 최소*
- B) **pino** 구조화 로깅 + level 환경변수
- C) **winston** + 파일 로그
- D) 로깅 없음

[Answer]: A

---

### Q12. CORS / 보안 헤더 정책

- A) **단일 origin 허용** (`FRONTEND_URL` env로 설정) + 기본 helmet 적용 — *추천*
- B) 와일드카드(`*`) 허용 (개발만)
- C) 다중 origin 화이트리스트

[Answer]: 다시 말하지만 워크숍에서 하는 MVP 정도야

---

### Q13. 패키지 매니저 / Node 버전

- A) **npm + Node 20 LTS** — *추천: 가장 표준*
- B) pnpm + Node 20 LTS
- C) yarn (classic) + Node 20

[Answer]: A

---

### Q14. 모노레포 / 디렉토리 구조

`backend/`와 `frontend/`를 한 레포 안에서 어떻게 구성할까요?

- A) **루트에 backend/ frontend/ 두 폴더 + 각자 독립 package.json** (모노레포 도구 없음) — *추천: 단순*
- B) **npm workspaces** 사용 (공유 타입 패키지 가능)
- C) **turborepo / nx** 도입

[Answer]: A

---

### Q15. FE↔BE 공유 타입

API 응답/요청 타입을 어떻게 공유할까요?

- A) **각자 수동으로 정의** (작은 규모, MVP) — *추천*
- B) **shared/types/ 폴더를 양쪽에서 import** (workspaces로 묶을 때)
- C) **OpenAPI 스펙 → 코드 생성**
- D) **tRPC / GraphQL codegen**

[Answer]: 지금 작업을 UNIT 1 ~ 4 나눠서 작업하니 모두다  공유해서 사용할 수 있게 적절한거로해줘

---

### Q16. Frontend 공통 컴포넌트 범위

Foundation이 제공할 **공통 컴포넌트** 범위를 확정합니다. 다음 목록에 동의하시나요?

- `Button` (variant: primary/secondary/danger, size: sm/md/lg, 44x44px 최소 보장)
- `Modal` (open, onClose, title, children, footer)
- `Loading` (size, fullscreen 옵션)
- `ConfirmDialog` (title, message, onConfirm, onCancel, confirmLabel, danger flag)
- `Toast`/`ErrorBanner` (성공/에러 메시지) — *포함 권장*
- `Input`, `Select`, `TextArea` (form 기초) — *포함 권장*

전체 포함/일부 제외/추가 자유롭게 적어주세요.

[Answer]:  적절하게 너가해 다시말하지만 이건 MVP야

---

### Q17. Frontend 상태/라우팅 기본

17-1) **라우팅 라이브러리**:
- A) **react-router-dom v6** — *추천: 표준*
- B) tanstack router

[Answer]: 적절하게 너가해 다시말하지만 이건 MVP야

17-2) **App.tsx 라우팅 쉘**: Foundation 시점에는 각 Unit의 페이지를 **placeholder 컴포넌트로 등록**하고, 각 Unit 담당자가 실제 구현으로 교체하는 방식이 좋을까요?
- A) **그렇게 진행** — *추천: 각 Unit 독립 개발 보장*
- B) 라우트는 Foundation에서 비워두고 각 Unit이 추가

[Answer]: 적절하게 너가해 다시말하지만 이건 MVP야

---

### Q18. API Client 기반 (`api/client.ts`)

공통 API Client에 어떤 기능을 포함할까요? (복수 선택)

- A) baseURL 설정 (env)
- B) 공통 헤더 (Content-Type, Authorization)
- C) 응답 자동 unwrap (`{success, data}` → `data` 또는 throw `ApiError`)
- D) 인증 토큰 자동 부착 (localStorage에서)
- E) 401 응답 시 자동 로그아웃/리다이렉트
- F) 요청 timeout (예: 10초)

추천: A+B+C+D+F (E는 각 Auth Context에서 처리 권장)

[Answer]: 적절하게 너가해 다시말하지만 이건 MVP야

---

### Q19. 테스트 도구 / 디렉토리

19-1) **Backend 테스트 도구**:
- A) **Jest** + supertest — *추천: 표준*
- B) Vitest + supertest

[Answer]: 적절하게 너가해 다시말하지만 이건 MVP야

19-2) **Frontend 테스트 도구**:
- A) **Vitest** + React Testing Library — *추천: Vite 친화*
- B) Jest + React Testing Library

[Answer]: 적절하게 너가해 다시말하지만 이건 MVP야

19-3) **테스트 DB**:
- A) **Docker로 별도 PostgreSQL 컨테이너** + 각 테스트 후 트랜잭션 롤백 — *추천*
- B) SQLite in-memory (Prisma sqlite provider)
- C) 동일 dev DB 사용 + truncate

[Answer]: 적절하게 너가해 다시말하지만 이건 MVP야. SQLITE로 해도 되고 인메모리로 해도돼, 덜 복잡한 방법으로해 

---

### Q20. 코드 품질 도구 (lint/format)

- A) **ESLint + Prettier + TypeScript strict** — *추천*
- B) Biome (lint+format 단일 도구)
- C) 도구 없음 (MVP 속도 우선)

[Answer]: A

---

### Q21. Git/CI 기초

21-1) **pre-commit hook (Husky + lint-staged)**:
- A) 도입 — *추천: 4명 협업*
- B) 미도입

[Answer]: A

21-2) **CI 파이프라인 (GitHub Actions 등)**:
- A) **Foundation에서 기본 CI yaml 1개 추가** (lint + test + build) — *추천*
- B) Foundation 범위에서 제외, 추후 도입
- C) 사용 안 함

[Answer]: C

---

### Q22. 도커 구성

22-1) **개발용 docker-compose 구성요소**:
- A) **DB(postgres) + Backend(node) 두 서비스, Frontend는 호스트의 Vite dev server** — *추천: HMR 빠름*
- B) DB + Backend + Frontend 모두 컨테이너
- C) DB만 컨테이너, 나머지는 호스트

[Answer]: A

22-2) **DB 영속화**:
- A) named volume — *추천*
- B) bind mount
- C) ephemeral (재기동 시 초기화)

[Answer]: A

---

### Q23. 추가로 정해야 할 것

위 항목 외에 Foundation 단계에서 4명이 합의해두면 좋을 규칙/관례가 있다면 적어주세요. (예: 커밋 메시지 컨벤션, 브랜치 전략, PR 리뷰 규칙, 문서 작성 규칙 등)

[Answer]: 적절하게 너가해 다시말하지만 이건 MVP야

---

## 다음 단계
모든 [Answer]: 가 채워지면, 모호한 응답이 있는지 검토 후 **Foundation Functional Design 산출물 4종**을 생성합니다.
