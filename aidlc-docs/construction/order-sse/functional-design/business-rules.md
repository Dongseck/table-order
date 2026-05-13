# Unit 3 (Order + SSE) — Business Rules

---

## 1. 주문 생성 규칙

### R-ORD-01: 메뉴 유효성 검증
- `items[].menuItemId`로 MenuItem 조회
- 존재하지 않으면 → `ORDER_NOT_FOUND` (삭제된 메뉴는 DB에 없으므로 자동 거부)
- MenuItem이 다른 매장 소속 → `FORBIDDEN`
- menuItemId 중복 불허 (동일 메뉴 2번 전송 → `VALIDATION_FAILED`)

### R-ORD-02: 가격 검증
- 서버가 `SUM(menuItem.price * item.quantity)` 계산
- 클라이언트 제출 `totalAmount`와 비교
- 불일치 → `ORDER_PRICE_MISMATCH` (details에 serverTotal 포함)

### R-ORD-03: 수량 제한
- `items.length`: 1~50 (빈 주문 불가, 50종 초과 불가)
- 각 `item.quantity`: 1~99
- 위반 시 → `VALIDATION_FAILED`

### R-ORD-04: 주문번호 산정
- 세션 내 순번: `MAX(orderNumber WHERE sessionId) + 1`
- 첫 주문이면 `1`
- 세션이 다르면 번호 리셋 (각 세션은 1부터 시작)

### R-ORD-05: 동일 메뉴 재주문
- 매번 새로운 Order 레코드 생성 (추가 주문 컨셉)
- 기존 주문에 merge하지 않음
- 주문번호 증가 (1, 2, 3…)

### R-ORD-06: 세션 자동 생성
- 주문 생성 시 활성 세션(endedAt IS NULL) 조회
- 없으면 `tableSessionService.getOrStartActiveSession(tableId)` 호출
- 한 테이블에 동시 활성 세션 1개 원칙 유지

---

## 2. 주문 상태 전이 규칙

### R-ORD-07: 허용 전이 맵

| 현재 상태 | 허용 목표 상태 |
|-----------|---------------|
| `PENDING` | `PREPARING` |
| `PREPARING` | `COMPLETED`, `PENDING` (롤백) |
| `COMPLETED` | (없음 — 최종 상태) |

### R-ORD-08: 불허 전이
- `PENDING → COMPLETED` (스킵 불가)
- `COMPLETED → *` (최종 상태에서 역전이 불가)
- 위반 시 → `ORDER_INVALID_STATUS_TRANSITION`

---

## 3. 주문 삭제 규칙

### R-ORD-09: 삭제 가능 상태
- `PENDING`: 삭제 가능
- `PREPARING`: 삭제 가능
- `COMPLETED`: 삭제 불가 → `ORDER_INVALID_STATUS_TRANSITION`

### R-ORD-10: 삭제 방식
- Hard Delete (Order + OrderItem CASCADE)
- 삭제 후 SSE `order:deleted` 이벤트 발행
- 삭제된 주문은 복구 불가

### R-ORD-11: 매장 소속 검증
- 관리자는 자기 매장(storeId) 소속 주문만 삭제 가능
- 다른 매장 주문 → `ORDER_NOT_FOUND` (404로 존재 여부 노출 방지)

---

## 4. SSE 규칙

### R-SSE-01: 인증
- Authorization 헤더 또는 `?token=` 쿼리스트링에서 JWT 추출
- 유효한 admin JWT 필요
- 인증 실패 → 401 HTTP 응답 (SSE 연결 수립 전 거부)

### R-SSE-02: 구독 필터
- 연결 시 `?tableIds=1,3,5` → 해당 테이블 이벤트만 수신
- 연결 시 `?eventTypes=order:new,order:status` → 해당 타입만 수신
- 파라미터 미제공 → 매장 전체 이벤트 수신

### R-SSE-03: fan-out 범위
- 매장(storeId) 단위로 이벤트 발행
- 동일 매장 내 여러 관리자 접속 가능
- 각 관리자별 구독 필터 독립 적용

### R-SSE-04: Heartbeat
- 30초 간격 `: heartbeat\n\n` 전송
- 전송 실패 → 해당 클라이언트 pool에서 제거

### R-SSE-05: 이벤트 발행 시점
- 주문 생성 → DB 트랜잭션 커밋 **후** `order:new` 발행
- 상태 변경 → UPDATE 커밋 **후** `order:status` 발행
- 주문 삭제 → DELETE 커밋 **후** `order:deleted` 발행
- `table:completed`는 Unit 4에서 발행 (sseManager.broadcast 호출)

### R-SSE-06: 재연결
- 클라이언트 측 자동 재연결 (3초 간격, 지수 백오프, 최대 5회)
- 재연결 성공 시 GET /admin/orders로 전체 상태 재조회
- 5회 실패 시 수동 재연결 버튼 표시

---

## 5. 장바구니 규칙 (Frontend)

### R-CART-01: 저장소
- localStorage 사용
- key: `cart_${storeId}_${tableId}`
- 페이지 새로고침 시 유지

### R-CART-02: 수량 제한
- 메뉴 종류: 최대 50개
- 각 메뉴 수량: 1~99
- 초과 시 toast 에러 메시지

### R-CART-03: 장바구니 비우기 시점
- 주문 성공 시 자동 비우기 (FR-04-3)
- 사용자 수동 비우기 (전체 비우기 버튼)
- 이용완료 시: 고객 측은 SSE 미구독이므로 장바구니 유지 → 새 주문 시 새 세션 자동 생성

### R-CART-04: 가격 정합성
- 장바구니에 담을 때 시점의 가격 저장
- 주문 제출 시 서버가 현재 DB 가격으로 재계산
- 불일치 시 ORDER_PRICE_MISMATCH → 사용자에게 "가격이 변경되었습니다" 안내

---

## 6. 관리자 대시보드 규칙

### R-DASH-01: 초기 로드
- 페이지 로드 시 GET /admin/orders로 현재 활성 주문 전체 조회
- 이후 SSE로 실시간 업데이트 적용

### R-DASH-02: 테이블 카드 표시
- 각 카드: 테이블 번호, 총 주문 금액, 전체 주문 목록 (스크롤)
- 주문 없는 테이블도 카드 표시 가능 (필터에 따라)

### R-DASH-03: 필터링
- 특정 테이블 선택 필터 (멀티 선택 가능)
- 빈 테이블(주문 없음) 숨기기 토글
- 두 필터 조합 가능

### R-DASH-04: 신규 주문 강조
- `order:new` 이벤트 수신 시 해당 주문 항목에 "NEW" 배지 표시
- 배지는 5초 후 자동 제거 (또는 관리자가 상태 변경 시 즉시 제거)

### R-DASH-05: 주문 상세 모달
- 테이블 카드 내 주문 클릭 → OrderDetailModal 표시
- 모달에서 상태 변경 가능
- 모달에서 삭제 가능 (ConfirmDialog 후)

---

## 7. 에러 코드 (Unit 3 전용)

| 코드 | HTTP | 트리거 조건 |
|------|------|-------------|
| `ORDER_NOT_FOUND` | 404 | 주문 또는 메뉴 ID 미존재 |
| `ORDER_EMPTY` | 400 | items 배열 비어있음 |
| `ORDER_PRICE_MISMATCH` | 409 | 클라이언트/서버 가격 불일치 |
| `ORDER_INVALID_STATUS_TRANSITION` | 409 | 불허 상태 전이 또는 COMPLETED 삭제 시도 |
| `ORDER_ITEMS_OUT_OF_RANGE` | 400 | items.length > 50 |
| `INVALID_QUANTITY` | 400 | quantity < 1 또는 > 99 |
