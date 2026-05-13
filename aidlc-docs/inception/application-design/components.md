# Components Definition

## Backend Modules

### 1. Auth Module
**Purpose**: 관리자 및 테이블 인증/인가 처리

**Responsibilities**:
- 관리자 로그인 (JWT 토큰 발급, 16시간 만료)
- 테이블 인증 (API 키 생성 및 검증)
- 인증 미들웨어 (admin, table 역할별 분리)
- 로그인 시도 제한 (rate limiting)

**Interfaces**:
- `POST /api/v1/admin/auth/login` - 관리자 로그인
- `POST /api/v1/customer/auth/login` - 테이블 인증
- `adminAuthMiddleware` - 관리자 인증 미들웨어
- `tableAuthMiddleware` - 테이블 인증 미들웨어

---

### 2. Store Module
**Purpose**: 매장 정보 관리

**Responsibilities**:
- 매장 기본 정보 조회
- 매장 설정 관리

**Interfaces**:
- `GET /api/v1/admin/store` - 매장 정보 조회

---

### 3. Menu Module
**Purpose**: 메뉴 및 카테고리 CRUD 관리

**Responsibilities**:
- 카테고리 CRUD
- 메뉴 항목 CRUD
- 메뉴 노출 순서 관리
- 필수 필드 및 가격 범위 검증

**Interfaces**:
- `GET /api/v1/customer/menus` - 고객용 메뉴 전체 조회
- `GET /api/v1/admin/categories` - 카테고리 관리 (CRUD)
- `GET /api/v1/admin/menus` - 관리자 메뉴 관리 (CRUD)

---

### 4. Order Module
**Purpose**: 주문 생성, 조회, 상태 관리

**Responsibilities**:
- 주문 생성 (장바구니 → 주문 전환)
- 주문 상태 변경 (대기중/준비중/완료)
- 주문 삭제 (관리자 직권)
- 주문 내역 조회 (현재 세션/과거 이력)
- SSE 이벤트 발행 트리거

**Interfaces**:
- `POST /api/v1/customer/orders` - 주문 생성
- `GET /api/v1/customer/orders` - 현재 세션 주문 조회
- `GET /api/v1/admin/orders` - 관리자 주문 목록 조회
- `PATCH /api/v1/admin/orders/:id/status` - 주문 상태 변경
- `DELETE /api/v1/admin/orders/:id` - 주문 삭제

---

### 5. Table Module
**Purpose**: 테이블 관리 및 세션 라이프사이클

**Responsibilities**:
- 테이블 CRUD (번호, 비밀번호 설정)
- 테이블 세션 시작/종료
- 세션 종료 시 주문 이력 이동
- 과거 주문 내역 조회

**Interfaces**:
- `GET /api/v1/admin/tables` - 테이블 목록 조회
- `POST /api/v1/admin/tables` - 테이블 등록
- `POST /api/v1/admin/tables/:id/complete` - 이용 완료 (세션 종료)
- `GET /api/v1/admin/tables/:id/history` - 과거 주문 내역

---

### 6. SSE Module
**Purpose**: Server-Sent Events 실시간 통신 관리

**Responsibilities**:
- SSE 연결 관리 (관리자 클라이언트)
- 이벤트 브로드캐스트 (매장 단위)
- 연결 헬스체크 및 재연결 지원

**Interfaces**:
- `GET /api/v1/admin/sse/orders` - SSE 연결 (실시간 주문 스트림)

---

## Frontend Components

### Customer UI (`/customer/*`)

| Component | Purpose |
|-----------|---------|
| LoginPage | 초기 설정 / 자동 로그인 |
| MenuPage | 메뉴 조회 (기본 화면) |
| CategoryTabs | 카테고리 탭 네비게이션 |
| MenuCard | 개별 메뉴 카드 |
| CartDrawer | 장바구니 슬라이드 패널 |
| CartItem | 장바구니 아이템 (수량 조절) |
| OrderConfirmPage | 주문 최종 확인 |
| OrderSuccessModal | 주문 성공 (5초 후 리다이렉트) |
| OrderHistoryPage | 주문 내역 조회 |

### Admin UI (`/admin/*`)

| Component | Purpose |
|-----------|---------|
| LoginPage | 관리자 로그인 |
| DashboardPage | 실시간 주문 모니터링 (그리드) |
| TableCard | 테이블별 주문 카드 |
| OrderDetailModal | 주문 상세 보기 |
| TableManagePage | 테이블 관리 |
| OrderHistoryModal | 과거 주문 내역 |
| MenuManagePage | 메뉴 관리 (CRUD) |
| MenuForm | 메뉴 등록/수정 폼 |
