# Requirements Verification Questions

요구사항을 분석한 결과 다음 항목들에 대한 확인이 필요합니다.
각 질문의 [Answer]: 태그 뒤에 선택한 옵션 문자를 입력해 주세요.

---

## Question 1
백엔드 개발 언어/프레임워크로 무엇을 사용하시겠습니까?

A) Node.js + Express (JavaScript/TypeScript)
B) Python + FastAPI
C) Java + Spring Boot
D) Go + Gin/Echo
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
프론트엔드 프레임워크로 무엇을 사용하시겠습니까? (고객용 UI 및 관리자 UI 모두)

A) React (Vite + TypeScript)
B) Vue.js (Vite + TypeScript)
C) Next.js (React 기반 풀스택)
D) Angular
X) Other (please describe after [Answer]: tag below)

[Answer]: 너가 비교와 추천해줘

## Question 3
데이터베이스로 무엇을 사용하시겠습니까?

A) PostgreSQL (관계형)
B) MySQL (관계형)
C) MongoDB (NoSQL Document)
D) DynamoDB (AWS NoSQL)
X) Other (please describe after [Answer]: tag below)

[Answer]: 너가 비교와 추천해줘

## Question 4
배포 환경은 어떻게 계획하시겠습니까?

A) AWS (EC2, RDS, S3 등)
B) 로컬/온프레미스 서버
C) Docker + Docker Compose (로컬 개발 우선, 추후 클라우드)
D) Serverless (AWS Lambda, API Gateway 등)
X) Other (please describe after [Answer]: tag below)

[Answer]: 너가 비교와 추천해줘

## Question 5
고객용 UI와 관리자 UI를 어떻게 구성하시겠습니까?

A) 하나의 프론트엔드 프로젝트에서 라우팅으로 분리
B) 완전히 별개의 프론트엔드 프로젝트 2개 (별도 배포)
C) 모노레포(Monorepo)에서 공통 코드를 공유하는 2개 앱
X) Other (please describe after [Answer]: tag below)

[Answer]: 너가 비교와 추천해줘

## Question 6
메뉴 이미지는 어떻게 관리할 예정입니까?

A) 외부 이미지 URL을 직접 입력 (별도 업로드 기능 없음)
B) 서버에 파일 업로드 후 정적 파일로 서빙
C) AWS S3 등 클라우드 스토리지에 업로드
X) Other (please describe after [Answer]: tag below)

[Answer]: 너가 비교와 추천해줘

## Question 7
예상 규모는 어느 정도입니까? (MVP 기준)

A) 소규모 - 단일 매장, 테이블 10개 이하
B) 중규모 - 단일 매장, 테이블 10~50개
C) 대규모 - 다중 매장 지원, 매장당 테이블 50개 이상
X) Other (please describe after [Answer]: tag below)

[Answer]: 너가 비교와 추천해줘

## Question 8
프로젝트 아키텍처 패턴은 어떤 것을 선호하시겠습니까?

A) 모놀리식 (하나의 백엔드 서버에 모든 API 포함)
B) 모듈형 모놀리스 (하나의 서버, 도메인별 모듈 분리)
C) 마이크로서비스 (도메인별 독립 서비스)
X) Other (please describe after [Answer]: tag below)

[Answer]: 너가 비교와 추천해줘

## Question 9
테스트 전략은 어떤 수준으로 구현하시겠습니까?

A) 기본 - 핵심 API에 대한 단위 테스트만
B) 표준 - 단위 테스트 + API 통합 테스트
C) 포괄적 - 단위 + 통합 + E2E 테스트
X) Other (please describe after [Answer]: tag below)

[Answer]: 너가 비교와 추천해줘

---

## Extension Opt-In Questions

## Question 10
이 프로젝트에 보안 확장 규칙을 적용하시겠습니까?

A) Yes — 모든 SECURITY 규칙을 블로킹 제약으로 적용 (프로덕션급 애플리케이션 권장)
B) No — SECURITY 규칙 건너뛰기 (PoC, 프로토타입, 실험적 프로젝트에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: 너가 비교와 추천해줘

## Question 11
이 프로젝트에 Property-Based Testing (PBT) 규칙을 적용하시겠습니까?

A) Yes — 모든 PBT 규칙을 블로킹 제약으로 적용 (비즈니스 로직, 데이터 변환, 직렬화, 상태 관리 컴포넌트가 있는 프로젝트 권장)
B) Partial — 순수 함수 및 직렬화 라운드트립에 대해서만 PBT 규칙 적용 (알고리즘 복잡도가 제한적인 프로젝트에 적합)
C) No — PBT 규칙 건너뛰기 (단순 CRUD, UI 전용 프로젝트, 비즈니스 로직이 거의 없는 얇은 통합 레이어에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: 너가 비교와 추천해줘
