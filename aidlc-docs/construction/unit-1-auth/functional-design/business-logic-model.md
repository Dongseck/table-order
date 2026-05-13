# Unit 1 (Auth) — Business Logic Model

> 인증/인가 로직의 함수적 모델. Foundation의 응답 포맷·미들웨어·시드를 그대로 사용.

---

## 1. 사용 사례 개요

| 사용 사례 | Endpoint | 액터 |
|-----------|----------|------|
| 관리자 로그인 | `POST /api/v1/admin/auth/login` | Admin (브라우저) |
| 테이블 로그인 (초기 설정) | `POST /api/v1/customer/auth/login` | Table tablet (1회 입력) |
| 자동 로그인 검증 | `GET /api/v1/customer/auth/me` | Table tablet (재진입) |
| 인증 미들웨어 | `adminAuth`, `tableAuth` | 모든 Unit이 import |

---

## 2. 관리자 로그인 시퀀스 (FR-06)

```
[Admin Browser]                  [Backend]                   [DB]
      │  POST /admin/auth/login    │                            │
      │  { storeCode, username,    │                            │
      │    password }              │                            │
      │ ─────────────────────────► │                            │
      │                            │ loginRateLimiter check     │
      │                            │ (IP+storeCode 1분 5회)      │
      │                            │                            │
      │                            │ Zod validate(body)         │
      │                            │                            │
      │                            │ findStoreByCode ──────────►│
      │                            │ ◄────────────── Store      │
      │                            │ findAdminUser(storeId,     │
      │                            │   username) ──────────────►│
      │                            │ ◄──────── AdminUser|null   │
      │                            │ bcrypt.compare(password)   │
      │                            │                            │
      │                            │ ─ 성공: jwt.sign({         │
      │                            │   sub: adminUserId,        │
      │                            │   storeId, role:'admin' }, │
      │                            │   exp: 16h)                │
      │                            │                            │
      │ ◄─ 200 { token, expiresAt, │                            │
      │     store: {id,code,name}, │                            │
      │     username }             │                            │
      │                            │                            │
      │ localStorage.set(          │                            │
      │   'auth.adminToken', token)│                            │
      │ navigate('/admin/dashboard')                            │
```

**실패 케이스**:
- Store/AdminUser 미존재 → `AUTH_INVALID_CREDENTIALS` (401, 메시지 동일)
- bcrypt 불일치 → `AUTH_INVALID_CREDENTIALS` (401)
- Validation 실패 → `VALIDATION_FAILED` (400, errorHandler가 처리)
- Rate limit 초과 → `AUTH_TOO_MANY_ATTEMPTS` (429, Foundation 미들웨어가 처리)

---

## 3. 테이블 로그인 시퀀스 (FR-01)

### 3.1 초기 1회 입력 (FR-01-1)
```
[Tablet]                         [Backend]                   [DB]
      │ POST /customer/auth/login  │                            │
      │ { storeCode, tableNumber,  │                            │
      │   password }               │                            │
      │ ─────────────────────────► │                            │
      │                            │ loginRateLimiter           │
      │                            │ validate(body)             │
      │                            │ findStore ────────────────►│
      │                            │ findTable(storeId,         │
      │                            │   tableNumber) ───────────►│
      │                            │ bcrypt.compare(password)   │
      │                            │ jwt.sign({                 │
      │                            │   storeId, tableId,        │
      │                            │   role:'table' },          │
      │                            │   NO exp)                  │
      │ ◄─ 200 { token, tableId,   │                            │
      │     tableNumber, store }   │                            │
      │                            │                            │
      │ localStorage.set(          │                            │
      │   'auth.tableToken', token)│                            │
      │ navigate('/customer/menu') │                            │
```

### 3.2 재진입 시 자동 로그인 (FR-01-3, 1-4)
```
App mount → CustomerAuthContext init
  │
  │ token = localStorage.get('auth.tableToken')
  │
  ├─ token 없음 → setAuth(null) → ProtectedRoute가 /customer/login 리다이렉트
  │
  └─ token 있음
       │ GET /customer/auth/me  (Authorization: Bearer)
       │ ──────────────────► [Backend]
       │                       tableAuth (실 검증)
       │                       findTable(req.auth.tableId)
       │ ◄── 200 { tableId, tableNumber, store }
       │
       │ ✓ setAuth(...) → 그대로 /customer/menu (또는 현재 URL 유지)
       │
       └─ 401 AUTH_TOKEN_INVALID
              │ localStorage.remove('auth.tableToken')
              │ setAuth(null)
              │ navigate('/customer/login')
```

> **만료 없음**: 테이블 JWT는 `exp` claim을 발급하지 않음. 무효화는 (1) 테이블 비밀번호 변경(서명 검증은 통과하지만 `findTable` 시 `tableId` 자체는 유효 — 변경 안 해도 토큰 유효함), (2) Table 삭제 시 `findTable` 실패 → `AUTH_TOKEN_INVALID`.

---

## 4. 인증 미들웨어 (실 구현)

### 4.1 `adminAuth`
```
1. Authorization 헤더에서 'Bearer <token>' 추출.
   없으면 → AUTH_TOKEN_INVALID (401)
2. jwt.verify(token, JWT_SECRET, { algorithms:['HS256'] })
   - TokenExpiredError → AUTH_TOKEN_EXPIRED (401)
   - JsonWebTokenError → AUTH_TOKEN_INVALID (401)
3. payload.role === 'admin' 확인 → 아니면 AUTH_TOKEN_INVALID
4. req.auth = { role:'admin', adminUserId: payload.sub, storeId: payload.storeId }
5. next()
```

### 4.2 `tableAuth`
```
1. Authorization 헤더 또는 ?token= 쿼리스트링에서 토큰 추출 (SSE 호환 — Unit 3에서 후속 활용)
   없으면 → AUTH_TOKEN_INVALID
2. jwt.verify (만료 검사 자동)
3. payload.role === 'table' 확인
4. req.auth = { role:'table', storeId, tableId: payload.tableId }
5. next()
```

> Foundation의 `req.auth` 타입 확장(`AdminAuthContext | TableAuthContext`)을 그대로 활용.

---

## 5. 토큰 발급 정책

### Payload 구조

**Admin**:
```json
{
  "sub": 1,
  "storeId": 1,
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234625490
}
```

**Table**:
```json
{
  "storeId": 1,
  "tableId": 5,
  "role": "table",
  "iat": 1234567890
}
```
(no `exp` claim)

### 발급 / 검증 인터페이스
```ts
// backend/src/modules/auth/jwt.ts
signAdminToken(payload: { adminUserId, storeId }): { token, expiresAt }
signTableToken(payload: { tableId, storeId }): { token }
verifyAdminToken(token): { adminUserId, storeId } | throws AppError
verifyTableToken(token): { tableId, storeId } | throws AppError
```

JWT_SECRET / JWT_EXPIRES_IN은 Foundation `config.ts`에서 가져옴.

---

## 6. API Endpoint 명세

### 6.1 POST `/api/v1/admin/auth/login`
- **Auth**: 없음 (rate-limited)
- **Body**:
  ```ts
  { storeCode: string; username: string; password: string; }
  ```
- **200 Response data**:
  ```ts
  {
    token: string;
    expiresAt: string;  // ISO with +09:00
    store: { id: number; code: string; name: string };
    username: string;
  }
  ```
- **Errors**: `AUTH_INVALID_CREDENTIALS`(401), `VALIDATION_FAILED`(400), `AUTH_TOO_MANY_ATTEMPTS`(429)

### 6.2 POST `/api/v1/customer/auth/login`
- **Auth**: 없음 (rate-limited)
- **Body**:
  ```ts
  { storeCode: string; tableNumber: number; password: string; }
  ```
- **200 Response data**:
  ```ts
  {
    token: string;
    tableId: number;
    tableNumber: number;
    store: { id: number; code: string; name: string };
  }
  ```
- **Errors**: 동일

### 6.3 GET `/api/v1/customer/auth/me`
- **Auth**: `tableAuth`
- **200 Response data**:
  ```ts
  {
    tableId: number;
    tableNumber: number;
    store: { id: number; code: string; name: string };
  }
  ```
- **Errors**: `AUTH_TOKEN_INVALID`(401)

> 관리자용 `me`는 워크숍 MVP라 추가하지 않음 (만료 16h 동안 변경 정보 없음).

---

## 7. Cross-Module Interaction

| 발생 | 호출 대상 | 호출자 |
|------|-----------|--------|
| 모든 보호 라우트의 인증 검증 | `adminAuth` / `tableAuth` (Unit 1) | Unit 2/3/4 |
| Foundation의 stub 교체 | `middlewares/auth.ts` 본 파일 | (자기 자신, Unit 1) |

> Foundation의 `adminAuth`/`tableAuth` stub은 본 파일을 import 경로 동일하게 교체. Unit 2/3/4의 코드 수정 0.

---

## 8. 보안 정책 (NFR-02)

| 항목 | 정책 |
|------|------|
| 비밀번호 저장 | bcrypt(cost=10), DB에만 |
| 토큰 서명 | HS256 + `JWT_SECRET` (.env) |
| 토큰 전달 | Authorization 헤더 (SSE 한정 쿼리스트링 허용) |
| Rate Limit | 1분 5회 (IP+storeCode 기준) — Foundation `loginRateLimiter` 활용 |
| 에러 메시지 | 자격 실패 시 username 존재 여부 노출 안 함 (`AUTH_INVALID_CREDENTIALS` 통일) |
| HTTPS | 워크숍 MVP는 HTTP. 운영 시 HTTPS 필수 (out of scope) |
