---
name: feedback-foundation-files
description: Foundation 소유 파일은 절대 수정하지 말 것 - 사용자가 명시적으로 경고함
metadata:
  type: feedback
---

Foundation 소유 파일을 수정하려고 하면 안 됨. Plan에 App.tsx 수정을 포함시켜서 지적받음.

**Why:** cross-unit-contracts 규칙에 명시된 수정 금지 파일을 건드리면 4인 병렬 개발에서 충돌 발생. 사용자가 "앞으로 조심해"라고 경고함.

**How to apply:** 코드 생성/수정 전 항상 cross-unit-contracts.md §5 "건드리지 않습니다" 목록 확인. 특히 app.ts, App.tsx, schema.prisma, shared/types/domain.ts, api/common.ts, docker-compose.yml, seed.ts, 공통 컴포넌트, API client. placeholder 파일은 같은 경로/이름/default export로 내용만 교체.
