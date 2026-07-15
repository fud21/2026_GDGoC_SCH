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

MySQL(또는 MariaDB)에 접속해서 스키마를 실행합니다. 챕터 시드 데이터가 함께 들어갑니다.

```bash
mysql -u root -p < database/schema.sql
```

### 2. 백엔드

```bash
cd backend
cp .env.example .env   # DB 접속 정보 + JWT_SECRET 입력
npm install
npm run dev             # http://localhost:4000
```

### 3. 프론트엔드

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173 (API는 4000으로 프록시됨)
```

## 현재 구현 상태 (P0)

- 회원가입 / 로그인 (JWT) — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- 투자 성향 설문 (10문항, 5단계 분류) — `GET /api/survey/questions`, `POST /api/survey/submit`
- 프론트: 가입 → 성향 진단 온보딩 → 홈 대시보드 (레벨/XP 표시)
- 다음 단계: P1 교육(레슨/퀴즈/용어사전) → P2 모의투자 → P3 AI 어시스턴트 (로드맵은 docs/PLAN.md 8장)
