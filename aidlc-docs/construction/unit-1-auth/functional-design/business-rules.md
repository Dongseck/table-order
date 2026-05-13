# Unit 1 (Auth) — Business Rules

> Unit 1이 적용·강제하는 인증/인가 규칙. Foundation의 validation 스키마와 에러 코드를 재사용.

---

## 1. 입력 검증 규칙

### Admin Login (`POST /admin/auth/login`)
```ts
z.object({
  storeCode: StoreCodeSchema,         // 2~50자, [a-z0-9-]
  username: AdminUsernameSchema,      // 3~30자, [a-zA-Z0-9_]
  password: z.string().min(1),        // 길이만 (정책 검증은 로그인 시 불필요)
})
```

### Customer Login (`POST /customer/auth/login`)
```ts
z.object({
  storeCode: StoreCodeSchema,
  tableNumber: TableNumberSchema,     // 1~999
  password: z.string().min(1),
})
```

> 비밀번호 정책(8자/4자 등)은 **회원가입/변경 시점**의 룰. **로그인 시점**은 길이만 체크 후 bcrypt.compare로 위임.

---

## 2. 인증 흐름 규칙

### R1. 자격 검증 통일 메시지
- Store 미존재, AdminUser 미존재, 비밀번호 불일치 → **모두 `AUTH_INVALID_CREDENTIALS`(401)** 동일 메시지
- 이유: username/storeCode enumeration 방지

### R2. JWT 발급
- 알고리즘: **HS256**
- 비밀키: `process.env.JWT_SECRET` (Foundation config)
- 관리자: `exp = now + JWT_EXPIRES_IN` (기본 16h)
- 테이블: `exp` 미설정 (무기한)

### R3. JWT 검증
| 상황 | 에러 코드 | HTTP |
|------|-----------|------|
| Authorization 헤더 없음/형식 오류 | `AUTH_TOKEN_INVALID` | 401 |
| 서명 검증 실패 | `AUTH_TOKEN_INVALID` | 401 |
| 만료(`TokenExpiredError`) | `AUTH_TOKEN_EXPIRED` | 401 |
| payload.role 불일치 | `AUTH_TOKEN_INVALID` | 401 |
| 토큰의 referenced 엔티티 미존재 (예: `me`에서 table 삭제됨) | `AUTH_TOKEN_INVALID` | 401 |

### R4. Rate Limit 적용 라우트
- `POST /admin/auth/login`
- `POST /customer/auth/login`
- 정책: Foundation `loginRateLimiter` 그대로 (1분 5회, IP+storeCode key)
- 초과: `AUTH_TOO_MANY_ATTEMPTS` (429)

### R5. SSE 라우트 인증 (참고)
- Unit 3 SSE 라우트는 헤더 부착 불가하므로 `?token=` 쿼리스트링도 허용
- `tableAuth`/`adminAuth`는 양쪽(헤더, 쿼리)에서 토큰 추출 → 본 Unit이 미들웨어에 구현

### R6. 인증 미들웨어 적용 정책
- Foundation의 stub은 **모든 보호 라우트가 통과**하도록 시드 id=1을 채워줌
- Unit 1이 실 검증으로 교체하면 모든 보호 라우트가 자동으로 토큰 필요
- Unit 2/3/4 라우트 정의 시 `router.method(path, adminAuth|tableAuth, handler)` 형태로 미들웨어 명시
- Foundation 제공 `loginRateLimiter` 미들웨어는 인증 미들웨어 이전에 적용 (인증 없이도 호출되므로)

---

## 3. 토큰 라이프사이클 (관리자 16h)

```
[login] ──► token (exp: now+16h)  ──► localStorage.adminToken
                                       │
                                       │ API call (Authorization: Bearer <token>)
                                       ▼
                              adminAuth.verify
                              ├─ valid → req.auth 세팅 → handler
                              ├─ expired → 401 AUTH_TOKEN_EXPIRED
                              │            └► FE: localStorage 삭제 + /admin/login
                              └─ invalid → 401 AUTH_TOKEN_INVALID (동일 처리)
```

- **재발급/리프레시 없음** (R7): 만료 시 사용자가 재로그인. 워크숍 MVP라 충분.

---

## 4. 동시 로그인 정책 (Q9)

- **R8. 다중 세션 허용**: 동일 AdminUser가 여러 기기에서 동시 로그인 가능
- JWT stateless — 서버는 발급된 active token을 추적하지 않음
- 비밀번호 변경 시에도 기존 발급 토큰은 만료까지 유효 (워크숍 MVP라 비밀번호 변경 기능 자체 미포함)

---

## 5. 로그아웃 정책

### R9. 관리자
- 로그아웃 = `localStorage.removeItem('auth.adminToken')` + `setAuth(null)` + `navigate('/admin/login')`
- 서버 호출 없음 (JWT stateless)
- 다른 기기의 토큰에는 영향 없음

### R10. 테이블
- 명시적 로그아웃 미제공
- 무효화 방법:
  1. 관리자가 테이블 비밀번호 재설정 (Unit 4) — 단, 이미 발급된 JWT는 서명 검증 통과해서 유효 (테이블 토큰 페이로드에 password hash 없음). **본 워크숍 MVP는 이 한계를 수용** — 운영 환경에서는 token 무효화 메커니즘 필요.
  2. Table 자체 삭제 → `me` 호출 시 `findTable` 실패 → 401

---

## 6. Frontend 동작 규칙

### R11. 401 자동 처리
- `client.ts`가 throw하는 `ApiError`의 `status === 401` AND `code === 'AUTH_TOKEN_EXPIRED'|'AUTH_TOKEN_INVALID'`:
  - 호출 발생 위치의 AuthContext가 `logout()` 호출 → localStorage 삭제 + `setAuth(null)` + 로그인 페이지로 redirect
- 구현 방식: 각 AuthContext 내부에 `useEffect` + 글로벌 `window.addEventListener('auth-error', ...)` 또는 axios-like interceptor. **워크숍 MVP는 client.ts에 onAuthError 콜백 등록 방식**.

### R12. App.tsx 비수정 원칙
- Unit 1은 `App.tsx`를 수정하지 않음 (Foundation 소유)
- 대신:
  1. AuthContext Provider는 **각 페이지가 필요 시 직접 wrap** (예: AdminLoginPage는 wrap 불필요, ProtectedRoute가 필요한 페이지에서 wrap)
  2. ProtectedRoute는 **각 페이지 컴포넌트 내부에서 사용** → 페이지 컴포넌트 = `<AdminProtectedRoute><실제내용/></AdminProtectedRoute>` 패턴
  3. 또는 hook 패턴: `useAdminAuthGuard()` — mount 시 토큰 없으면 navigate('/admin/login')
- → 결과: `App.tsx` 수정 없이도 보호 동작. Unit 2/3/4 담당자도 자기 페이지 안에서 Guard만 import해서 wrap.

### R13. 토큰 자동 부착 (Foundation 재사용)
- `localStorage.adminToken` 존재 시 → `/admin/*` 호출에 자동 Bearer
- `localStorage.tableToken` 존재 시 → `/customer/*` 호출에 자동 Bearer
- 따라서 Unit 1은 토큰 저장만 책임지면 됨

### R14. UX (Q10)
- 에러: Toast로 표시 (Foundation `useToast`)
- 로딩: Button `loading` prop 활용
- Rate limit (429): Toast 메시지 + 클라이언트 측 1분 카운트다운으로 버튼 비활성화

---

## 7. 시드 데이터 의존성

| 시드 | 활용 |
|------|------|
| Store `store-demo` | Login 폼 default placeholder (선택), 시연 |
| AdminUser `admin` / `Admin1234!` | 관리자 로그인 시연 |
| Table 1~10 / `0000` | 테이블 로그인 시연 |

> 워크숍 진행자 측면에서 시연 시 위 자격을 외워둘 필요 없이 Frontend 로그인 폼의 **placeholder** 또는 **개발 모드 자동 채움** 기능을 두면 편함. 본 Unit 구현 시 placeholder 정도만 표시.

---

## 8. 에러 코드 매핑 (Unit 1 사용 항목)

| 에러 | HTTP | 상황 | 이미 등록됨? |
|------|------|------|--------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | 로그인 실패 | ✓ Foundation |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT 만료 (관리자) | ✓ Foundation |
| `AUTH_TOKEN_INVALID` | 401 | 토큰 위변조/형식 오류/엔티티 미존재 | ✓ Foundation |
| `AUTH_TOO_MANY_ATTEMPTS` | 429 | Rate limit | ✓ Foundation |
| `VALIDATION_FAILED` | 400 | Zod 실패 | ✓ Foundation (자동) |

Unit 1은 **새 에러 코드 추가 없음**. `error-codes.ts`의 Unit 1 섹션은 그대로 유지.
