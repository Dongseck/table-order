# Foundation — Generated Code Index

> Foundation Code Generation 산출물 인덱스. 모든 파일은 워크스페이스 루트에 생성되었으며, 본 문서는 그 위치와 책임을 요약합니다.

## Generated File Index

### 루트 / 공유
| 파일 | 설명 |
|------|------|
| `package.json` | npm scripts 통합 (dev/migrate/seed/lint/test/build) |
| `docker-compose.yml` | postgres 16 + (optional) backend 서비스 |
| `.gitignore`, `.editorconfig`, `.lintstagedrc.json`, `.husky/pre-commit` | 코드 품질/도커/Git 도구 |
| `shared/types/domain.ts` | 10개 엔티티 타입 (Foundation 소유) |
| `shared/types/api/common.ts` | `ApiSuccess<T>`, `ApiErrorBody` |
| `shared/types/api/{auth,menu,order,table}.ts` | Unit별 빈 export (담당자가 채움) |
| `shared/types/events.ts` | `SseEvent` 4종 union |

### Backend
| 파일 | 설명 |
|------|------|
| `backend/package.json` | Express, Prisma, JWT, bcrypt, zod, Jest 등 |
| `backend/tsconfig.json` | strict, `@shared/*` alias |
| `backend/.env.example` | DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT |
| `backend/prisma/schema.prisma` | 10개 엔티티 (postgres) |
| `backend/prisma/test.schema.prisma` | sqlite 미러 (테스트) |
| `backend/prisma/seed.ts` | Store 1 + Admin 1 + Table 10 + Category 3 + Menu 9 |
| `backend/src/common/` | error, error-codes, error-handler, response, validation, constants, prisma, rate-limiter |
| `backend/src/middlewares/auth.ts` | **adminAuth/tableAuth Foundation stub** (시드 1번으로 통과) |
| `backend/src/middlewares/{request-logger, not-found}.ts` | morgan, 404 핸들러 |
| `backend/src/modules/{auth,menu,order,sse,table}/router.ts` | 빈 Router stub (각 Unit이 채움) |
| `backend/src/modules/order/order.archive.ts` | **archiveSessionOrders 실 구현** (공유) |
| `backend/src/modules/sse/sse.manager.ts` | **SSE Manager stub** (console 출력) |
| `backend/src/modules/table/table-session.service.ts` | **TableSessionService stub** (getOrStart 실 동작) |
| `backend/src/{config,app,server}.ts` | env 로드, 앱 구성, 서버 진입 |
| `backend/jest.config.ts`, `tests/{setup, health.test}.ts` | Jest + supertest 셋업 + smoke test |
| `backend/Dockerfile`, `.dockerignore` | 다단계 빌드 |

### Frontend
| 파일 | 설명 |
|------|------|
| `frontend/package.json` | React 18, Vite 5, react-router v6, Vitest |
| `frontend/{tsconfig,vite.config,vitest.config}.ts` | strict, `@shared/*` + `@/*` alias |
| `frontend/.env.example` | VITE_API_BASE_URL |
| `frontend/index.html`, `src/main.tsx` | 진입점 |
| `frontend/src/styles/{reset,tokens}.css` | reset + 디자인 토큰 |
| `frontend/src/components/common/` | Button, Modal, Loading, ConfirmDialog, Toast, Input, Select, TextArea (data-testid 포함) |
| `frontend/src/api/client.ts` | `api.{get,post,patch,delete}` + `ApiError` + 토큰 자동 부착 + 10s timeout |
| `frontend/src/hooks/useApi.ts` | 공통 fetch hook (loading/error 관리) |
| `frontend/src/App.tsx` | **9개 라우트 사전 등록** (수정 금지) |
| `frontend/src/pages/{customer,admin}/*Placeholder.tsx` | 9개 placeholder (각 Unit이 교체) |
| `frontend/tests/setup.ts`, `Button.test.tsx` | Vitest + RTL smoke test |

## Verification Commands

```bash
# Install
npm run install:all

# Setup DB (Docker)
npm run db:up
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run migrate
npm run seed

# Run
npm run dev:backend     # → http://localhost:3000/health
npm run dev:frontend    # → http://localhost:5173

# Test
npm test
```

## Cross-Unit Contracts (참조)
4명이 0 충돌로 병렬 작업하는 방법은 [`../functional-design/cross-unit-contracts.md`](../functional-design/cross-unit-contracts.md) 참고.

## 다음 단계
4명은 자기 Unit 브랜치로 분기하여 다음 흐름으로 진행:
1. **CONSTRUCTION - Functional Design (per Unit)** — 자기 Unit의 비즈니스 로직 상세 설계
2. **CONSTRUCTION - Code Generation (per Unit)** — Foundation 위에 자기 모듈 구현
3. **CONSTRUCTION - Build and Test** — 모든 Unit 통합 후 E2E
