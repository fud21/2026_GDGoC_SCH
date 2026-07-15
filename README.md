# 2026_GDGoC_SCH

솔루션 챌린지 프로젝트 — **투자 교육 · 모의투자 플랫폼**

금융 초보자가 용어 학습 → 퀴즈/레벨업 → 모의투자 실전 연습으로 이어지는 학습 루프를 제공하고,
투자 성향에 맞춘 AI 어시스턴트가 함께합니다.
전체 기획/설계는 [docs/PLAN.md](docs/PLAN.md) 참고.

## 프로젝트 구조

```
frontend/   React 19 (Vite) — 모바일 우선 SPA
backend/    Node.js (Express) — REST API
database/   MySQL 스키마 (schema.sql)
docs/       기획/설계 문서
```

## 실행 방법

### 1. 데이터베이스

MySQL(또는 MariaDB)에 접속해서 스키마와 P1 교육 콘텐츠를 순서대로 실행합니다.

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p gdgoc_sch < database/seed_edu.sql
```

`seed_edu.sql`은 빈 데이터베이스에 한 번만 실행합니다. 기존 P0/P1 데이터베이스를
사용한다면 XP 중복 방지 제약을 한 번 적용합니다.

```bash
mysql -u root -p < database/migrations/001_unique_xp_event_reason.sql
```

### 2. 백엔드

```bash
cd backend
cp .env.example .env   # DB 접속 정보 + JWT_SECRET 입력
npm install
npm run dev             # http://localhost:4000
npm test                # 퀴즈 입력 검증 단위 테스트
```

### 3. 프론트엔드

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173 (API는 4000으로 프록시됨)
```

## 현재 구현 상태 (P1)

- 회원가입 / 로그인 (JWT) — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- 투자 성향 설문 (10문항, 5단계 분류) — `GET /api/survey/questions`, `POST /api/survey/submit`
- 교육: 4개 챕터, 12개 레슨, 레슨/종합 퀴즈, XP/레벨, 용어사전
- 프론트: 가입 → 성향 진단 → 홈 → 교육/퀴즈/용어사전 모바일 우선 흐름
- 퀴즈 답변 완전성 검증 및 XP 보상 사유별 1회 지급
- 다음 단계: P2 업비트 시세 기반 가상 코인 모의투자 → P3 Gemini 어시스턴트

현재 모의투자 화면은 플레이스홀더이며 AI 호출 코드는 아직 없습니다. 세부 로드맵과
현재 범위는 [docs/PLAN.md](docs/PLAN.md) 8장을 참고하세요.
