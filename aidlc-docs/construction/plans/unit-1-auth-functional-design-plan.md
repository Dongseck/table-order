# Unit 1 (Auth) - Functional Design Plan

## Stage
CONSTRUCTION → Functional Design (Unit: **Unit 1 - Auth**)

## Branch
`unit/auth` (분기 완료 from main @ Foundation 머지본)

## Unit Scope
Unit 1은 **인증/인가 전체**를 담당합니다. Foundation의 `auth.ts` middleware stub과 빈 `auth/router.ts`, 빈 `shared/types/api/auth.ts`를 실 구현으로 교체합니다.

### Backend 산출물 예정
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/jwt.ts` (토큰 발급/검증)
- `backend/src/modules/auth/router.ts` (현재 빈 stub → 채움)
- `backend/src/middlewares/auth.ts` (현재 stub → 실 검증)
- 단위/통합 테스트

### Frontend 산출물 예정
- `frontend/src/pages/customer/CustomerLoginPlaceholder.tsx` → 실 LoginPage로 교체
- `frontend/src/pages/admin/AdminLoginPlaceholder.tsx` → 실 LoginPage로 교체
- `frontend/src/contexts/CustomerAuthContext.tsx`
- `frontend/src/contexts/AdminAuthContext.tsx`
- `frontend/src/api/auth.ts`
- (선택) `frontend/src/components/auth/ProtectedRoute.tsx`

### 공유 타입
- `shared/types/api/auth.ts` (현재 빈 stub → DTO 채움)

### FR Coverage
- **FR-01**: 테이블 태블릿 자동 로그인
- **FR-06**: 매장 인증 (16시간 세션)
- **NFR-02**: 보안 (bcrypt/JWT/rate limit) — Foundation 인프라 활용

### Foundation에서 이미 결정·구현된 사항 (재사용)
- bcrypt cost = 10
- JWT HS256, 관리자 16h, 테이블 무기한
- Rate limit: 1분 5회 (`loginRateLimiter` 미들웨어 활용)
- 응답 포맷 `{success, data, error}` (errorHandler가 처리)
- AdminUser/Table/Store 엔티티 (Prisma 스키마)
- 시드: `store-demo` / `admin` / `Admin1234!` / 테이블 1~10 (비번 `0000`)
- 에러 코드: `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_INVALID`, `AUTH_TOO_MANY_ATTEMPTS`
- LocalStorage 키 규약: `auth.adminToken`, `auth.tableToken`
- API Client의 토큰 자동 부착 동작

---

## Execution Plan (체크리스트)

- [x] Step 1: Unit Context 분석 (완료 — Foundation 산출물 기준)
- [x] Step 2: 본 Plan 파일 생성 + [Answer]: 태그 질문 배치
- [x] Step 3: 사용자 답변 수집
- [x] Step 4: 답변 모호성 검토 (Q7만 위임 → "App.tsx 비수정" 대안 채택)
- [x] Step 5: 산출물 생성
  - [x] `aidlc-docs/construction/unit-1-auth/functional-design/business-logic-model.md`
  - [x] `aidlc-docs/construction/unit-1-auth/functional-design/business-rules.md`
  - [x] `aidlc-docs/construction/unit-1-auth/functional-design/frontend-components.md`
  - [x] (Domain entities는 Foundation 스키마 그대로 사용 — 별도 파일 생략)
- [ ] Step 6: 완료 메시지 제시 (표준 2-옵션)
- [ ] Step 7: 사용자 승인 대기
- [ ] Step 8: audit.md 기록

---

## Clarifying Questions

> 답변 방식: `[Answer]:` 줄에 답을 적어주세요. 객관식은 알파벳, 자유 서술 모두 가능. 추천 옵션이 있으면 `추천` 또는 알파벳만 적어도 됩니다.

---

### Q1. 자동 로그인 흐름 (FR-01)

FR-01-2: "로그인 정보를 로컬 스토리지에 저장". 저장할 정보는?

- A) **토큰만 저장** (`auth.tableToken`) → 페이지 진입 시 토큰 검증 API 호출 → 유효하면 패스, 무효면 로그인 화면 — *추천: 보안상 비밀번호 미저장*
- B) credentials(storeCode+tableNumber+password) 저장 → 매번 자동 로그인 호출
- C) credentials + 토큰 모두 저장

[Answer]: A

---

### Q2. 토큰 검증 API 필요 여부

자동 로그인 시 토큰이 유효한지 서버에 묻는 endpoint 필요?

- A) **별도 `GET /api/v1/customer/auth/me`** 추가 (verify + 현 테이블 정보 반환) — *추천: 명시적 verify endpoint*
- B) 첫 메뉴 호출 등으로 자연 확인 (401 시 로그인 화면) — endpoint 추가 안 함
- C) JWT 만료 없으므로 로컬에서 형식만 확인 후 그대로 사용

[Answer]: A

---

### Q3. 관리자 로그인 후 리다이렉트

관리자 로그인 성공 시 어디로 이동?

- A) `/admin/dashboard` — *추천: FR-07 실시간 모니터링이 메인 화면*
- B) `/admin/tables`
- C) 로그인 전 가려던 페이지 (deepLink) — 워크숍 MVP에서는 과함

[Answer]:  A

---

### Q4. 테이블 로그인 후 리다이렉트

- A) `/customer/menu` — *추천: FR-02 메뉴가 기본 홈*
- B) 마지막 보던 화면 복원

[Answer]: A

---

### Q5. 로그아웃 기능

5-1) **관리자 로그아웃** 버튼 어디에?
- A) 대시보드/모든 관리자 페이지 상단 헤더 — *추천: 항상 접근 가능*
- B) 별도 메뉴/프로필 페이지
- C) 미제공 (16h 자동 만료에 의존)

[Answer]: A

5-2) **테이블 로그아웃**:
- A) 미제공 — 태블릿 자동 로그인 UX (관리자가 테이블 관리에서 비밀번호 재설정으로 무효화) — *추천: FR-01 의도*
- B) 고객 화면에서 명시적 로그아웃 버튼 제공

[Answer]: A

---

### Q6. 토큰 검증 실패 시 처리 (Frontend)

API 호출에서 `AUTH_TOKEN_EXPIRED`/`AUTH_TOKEN_INVALID` 응답이 오면?

- A) **각 AuthContext가 자동 감지 → localStorage 삭제 → 로그인 화면으로 리다이렉트** — *추천: Foundation의 client.ts는 401만 통과, Context가 후처리*
- B) 사용자가 다시 액션 수행해야 갱신 (수동)
- C) Refresh token 도입 (MVP 범위 아님 — 제외)

[Answer]: A

---

### Q7. ProtectedRoute 가드

각 라우트의 인증 보호 방식:

- A) **`<ProtectedRoute role="admin">` 컴포넌트로 admin 라우트 묶고, customer 라우트는 별도 `<TableProtectedRoute>`** — *추천: 명시적*
- B) 각 페이지 컴포넌트가 mount 시 토큰 체크
- C) Foundation 라우팅 쉘 그대로 유지 (가드 없음) — 통합 시 다른 Unit과 조율

> 참고: Foundation의 `App.tsx`는 모든 라우트가 placeholder. Unit 1이 ProtectedRoute를 App.tsx에 추가하려면 App.tsx 수정 필요. **App.tsx는 Foundation 소유 + cross-unit 충돌 영역**이므로 신중.
>
> 대안: Unit 1은 ProtectedRoute 컴포넌트만 제공하고, 각 페이지 컴포넌트가 자기 안에서 `<ProtectedRoute>...</ProtectedRoute>`로 감싸는 방식 → App.tsx 수정 없음.

[Answer]: 너의 선택에 맡길게 

---

### Q8. 관리자 비밀번호 변경 기능

- A) **미포함** — 워크숍 MVP, 시드 계정으로 시연 — *추천*
- B) 포함 (별도 `/admin/profile` 페이지)

[Answer]: A

---

### Q9. 동시 로그인 / 다중 세션

같은 관리자 계정이 여러 기기에서 동시 로그인 가능?

- A) **허용** — JWT stateless, 추적 안 함 — *추천: MVP 단순*
- B) 마지막 로그인이 이전 토큰 무효화 (서버에서 active token 추적)

[Answer]: A

---

### Q10. 로그인 폼 UX

10-1) **에러 메시지 위치**:
- A) 폼 상단 ErrorBanner (Foundation Toast 활용) — *추천*
- B) 각 필드별 inline error

[Answer]: A

10-2) **로딩 상태**:
- A) Button의 `loading` prop 활용 — *추천: Foundation Button이 지원*
- B) 별도 Loading 컴포넌트 fullscreen

[Answer]: A

10-3) **rate limit 도달 시 표시**:
- A) Toast로 "잠시 후 다시 시도해주세요" + 1분 카운트다운 — *추천*
- B) 단순 에러 메시지만

[Answer]: A

---

### Q11. 추가로 정할 것 (자유 서술)

위 항목 외에 Unit 1에서 결정하고 싶은 사항이 있으면 적어주세요. (예: 비밀번호 마스킹 토글, "기억하기" 체크박스, 키보드 단축키 등)

[Answer]: 

---

## 다음 단계
모든 [Answer]:가 채워지면 모호성 검토 후 산출물 3종 (business-logic-model, business-rules, frontend-components) 생성.
