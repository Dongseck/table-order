# Unit 3 (Order + SSE) — Functional Design Plan

## Stage
CONSTRUCTION → Functional Design (Unit: **Order + SSE**) — Part 1 (Planning)

## Unit Context
- **Unit**: Unit 3 — Order + SSE
- **FR Coverage**: FR-03 (장바구니), FR-04 (주문 생성), FR-05 (주문 내역 조회), FR-07 (실시간 주문 모니터링)
- **Dependencies**: Foundation (공통 모듈, Prisma 스키마, 공통 컴포넌트, API client)
- **Cross-Unit Stubs Used**: `tableSessionService.getOrStartActiveSession()` (Unit 4 제공 stub), `tableAuth`/`adminAuth` middleware (Unit 1 제공 stub)
- **Cross-Unit Stubs Provided**: `sseManager.broadcast()` — Unit 3이 실 구현으로 교체

---

## Plan Outline (체크리스트)

### Artifacts to Generate
- [x] `aidlc-docs/construction/order-sse/functional-design/business-logic-model.md`
- [x] `aidlc-docs/construction/order-sse/functional-design/business-rules.md`
- [x] `aidlc-docs/construction/order-sse/functional-design/domain-entities.md`
- [x] `aidlc-docs/construction/order-sse/functional-design/frontend-components.md`

---

## Clarifying Questions

Foundation에서 대부분의 공통 규칙이 정해졌으나, Unit 3 고유 비즈니스 로직에 대해 아래 항목을 확정해야 합니다.

---

### Category A: 주문 생성 로직

**Q1. 주문 생성 시 메뉴 유효성 검증 수준**

클라이언트가 `items[].menuItemId`를 보낼 때, 서버는 해당 메뉴가 존재하는지 + 동일 매장 소속인지 검증해야 합니다. 추가로 삭제된 메뉴에 대한 주문도 거부하나요?

- A) 존재하고 동일 매장이면 OK (삭제된 메뉴는 DB에서 이미 없으므로 자동 거부)
- B) 추가로 "비활성(숨김)" 상태인 메뉴도 거부해야 함 (MenuItem에 `isActive` 필드 필요)

[Answer]: 이미 삭제했는데 주문을 어떻게넣어? 보이지 않게해야지

---

**Q2. 클라이언트가 보내는 `totalAmount` 검증 방식**

Foundation business-rules R1에서 "클라이언트 제출 totalAmount와 서버 계산 불일치 시 `ORDER_PRICE_MISMATCH`"라고 정의했는데:

- A) 클라이언트가 `totalAmount`를 보내고, 서버가 계산한 값과 다르면 에러 반환 (가격 변경 감지용)
- B) 클라이언트는 `totalAmount`를 보내지 않고, 서버가 항상 계산하여 저장 (단순화)

[Answer]: A

---

**Q3. 동일 세션에서 같은 메뉴를 다시 주문할 경우**

이전 주문에 김치찌개 2개가 있는데, 새 주문에서 김치찌개 1개를 추가로 주문하면:

- A) 새로운 별도 Order 레코드 생성 (추가 주문 컨셉 — 주문번호 증가)
- B) 기존 Order의 수량 합산 (동일 주문에 merge)

[Answer]: A

---

### Category B: 주문 상태 관리

**Q4. 주문 상태 전이 규칙 확정**

Foundation R4에서 "MVP는 임의 변경 허용해도 무방"이라 했는데, Unit 3에서 확정:

- A) 순방향만 허용: `PENDING → PREPARING → COMPLETED` (역방향 불가)
- B) 관리자는 자유롭게 어떤 상태로든 변경 가능 (MVP 단순화)
- C) 순방향 + `PREPARING → PENDING` 롤백만 허용 (실수 복구)

[Answer]: C

---

**Q5. 주문 삭제 시 조건**

관리자가 대시보드에서 특정 주문을 삭제할 때:

- A) 어떤 상태든 삭제 가능 (PENDING/PREPARING/COMPLETED 모두)
- B) COMPLETED 상태인 주문은 삭제 불가 (이미 처리 완료된 주문 보호)
- C) PENDING 상태만 삭제 가능

[Answer]: B

---

### Category C: SSE 실시간 알림

**Q6. SSE 연결 관리 방식**

관리자가 대시보드에서 SSE 연결 시:

- A) 매장(storeId) 단위 fan-out — 같은 매장 관리자 모두 동일 이벤트 수신
- B) 개별 관리자(adminUserId) 단위 — 특정 관리자에게만 전송 가능

[Answer]: 관리자별 이벤트 설정 가능하게

---

**Q7. SSE 재연결 시 놓친 이벤트 처리**

네트워크 끊김 후 재연결 시:

- A) 재연결 시점부터 새 이벤트만 수신 (놓친 이벤트 무시, 클라이언트가 GET으로 현재 상태 재조회)
- B) Last-Event-ID 기반으로 놓친 이벤트 재전송 (이벤트 버퍼 필요)

[Answer]: 오류 안내 후 재실행 여부 확인

---

**Q8. SSE 연결 인증 방식 상세**

Foundation R10에서 쿼리스트링 token도 허용한다고 했는데:

- A) `EventSource`에 `?token=<jwt>` 쿼리스트링으로만 인증 (표준 EventSource 제약)
- B) 커스텀 EventSource (fetch 기반) 사용하여 Authorization 헤더 부착
- C) 둘 다 지원 (서버 미들웨어가 헤더 또는 쿼리스트링에서 토큰 추출)

[Answer]: C

---

### Category D: 장바구니 (Frontend)

**Q9. 장바구니 최대 항목 수**

- A) Foundation의 "1주문당 메뉴 종류 1~50개" 그대로 장바구니에도 적용
- B) 장바구니는 무제한, 주문 시점에만 50개 제한 체크

[Answer]: A

---

**Q10. 장바구니와 테이블/세션의 관계**

테이블이 이용완료 처리되어 세션이 종료된 경우, 해당 테이블의 장바구니:

- A) 자동 비우기 (SSE로 `table:completed` 이벤트 수신 시 localStorage 초기화)
- B) 그대로 유지 (새 세션에서 주문 시 사용 가능)

[Answer]: A

---

### Category E: 관리자 대시보드

**Q11. 대시보드 초기 데이터 로드**

SSE 연결 전 현재 주문 현황을 어떻게 가져오나요:

- A) GET `/api/v1/admin/orders`로 전체 활성 주문 조회 → 이후 SSE로 실시간 업데이트
- B) SSE 연결 시 서버가 현재 상태를 초기 이벤트로 전송 (`snapshot` 이벤트)

[Answer]: A

---

**Q12. 대시보드 테이블 카드에 표시할 정보**

각 테이블 카드에:

- A) 총 주문 금액 + 최신 3개 주문 미리보기 (FR-07-3 그대로)
- B) 총 주문 금액 + 전체 주문 목록 스크롤
- C) 총 주문 금액 + 최신 N개 미리보기 (N을 커스텀, 기본 3)

[Answer]: B

---

**Q13. 대시보드 필터링 범위**

FR-07-8에서 "테이블별 필터링"이라 했는데:

- A) 특정 테이블만 선택하여 보기 (나머지 카드 숨김)
- B) 주문 있는 테이블만 / 전체 테이블 토글
- C) A + B 모두 (테이블 선택 + 빈 테이블 숨기기 토글)

[Answer]: C

---

### Category F: 신규 주문 시각적 강조

**Q14. 신규 주문 강조 방식 (FR-07-6)**

- A) 테이블 카드 전체에 하이라이트 배경 + 3초 후 원래로 복귀
- B) 카드 내 신규 주문 항목에만 배지/색상 표시 (항목 수준 강조)
- C) 카드 테두리 애니메이션 (pulse) + 주문 항목 배지 조합

[Answer]: B

---

---

## Next Steps
사용자가 위 질문에 답변하면:
1. 답변 분석 및 모호한 부분 후속 질문
2. 4개 Functional Design 아티팩트 생성
3. 사용자 승인 요청
