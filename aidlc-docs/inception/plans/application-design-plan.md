# Application Design Plan

## Design Scope
테이블오더 MVP의 백엔드 모듈 구조, API 엔드포인트, 서비스 레이어, 컴포넌트 의존성 설계

## Plan Checklist

### Phase 1: Component Identification
- [x] 백엔드 모듈 정의 (auth, store, menu, order, table, sse)
- [x] 각 모듈의 책임 범위 정의
- [x] 프론트엔드 주요 페이지/컴포넌트 식별

### Phase 2: Component Methods
- [x] 각 모듈의 API 엔드포인트 설계 (method signatures)
- [x] 요청/응답 데이터 타입 정의
- [x] 인증/인가 범위 결정

### Phase 3: Service Layer Design
- [x] 서비스 간 오케스트레이션 패턴 정의
- [x] 주문 생성 플로우 서비스 조합 설계
- [x] SSE 이벤트 발행 서비스 설계

### Phase 4: Component Dependencies
- [x] 모듈 간 의존성 매트릭스 작성
- [x] 데이터 흐름 다이어그램 작성
- [x] 통신 패턴 정의

### Phase 5: Artifact Generation
- [x] Generate components.md
- [x] Generate component-methods.md
- [x] Generate services.md
- [x] Generate component-dependency.md
- [x] Generate application-design.md (consolidated)
- [x] Validate design completeness and consistency

---

## Design Questions

다음 질문에 답변해 주세요. 각 [Answer]: 태그 뒤에 선택 옵션을 입력해 주세요.

### Question 1
API 라우팅 구조를 어떻게 설계하시겠습니까?

A) 역할별 분리: `/api/customer/*` (고객용), `/api/admin/*` (관리자용)
B) 리소스 중심: `/api/menus`, `/api/orders`, `/api/tables` (인증으로 권한 분리)
C) 버전 포함 역할 분리: `/api/v1/customer/*`, `/api/v1/admin/*`
X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 2
고객 테이블 인증 방식의 토큰 전략은?

A) JWT 토큰 (관리자와 동일한 방식, payload에 역할 구분)
B) 단순 API 키 방식 (storeId + tableId + password 해시를 토큰으로)
C) 세션 기반 (서버 세션에 테이블 정보 저장)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
주문 상태 변경 시 SSE 이벤트 전파 범위는?

A) 매장 전체 브로드캐스트 (관리자 + 해당 매장의 모든 테이블 수신)
B) 관리자에게만 전파 (고객은 주문 내역 조회 시 polling)
C) 관리자 브로드캐스트 + 해당 테이블에만 개별 전파
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 4
에러 처리 및 API 응답 형식은?

A) 통일된 응답 래퍼: `{ success, data, error: { code, message } }`
B) HTTP 상태 코드 중심 + 에러 시에만 body: `{ error: { code, message } }`
C) REST 표준 준수 (RFC 7807 Problem Details)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5
프론트엔드 상태 관리 방식은?

A) React Context + useReducer (라이브러리 최소화)
B) Zustand (경량 상태 관리)
C) Redux Toolkit (대규모 상태 관리)
X) Other (please describe after [Answer]: tag below)

[Answer]: A
