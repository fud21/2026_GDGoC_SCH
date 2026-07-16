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

MySQL(또는 MariaDB)에 접속해서 스키마와 시드를 순서대로 실행합니다.

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p gdgoc_sch < database/seed_edu.sql   # 교육 콘텐츠 (빈 DB에 1회)
mysql -u root -p gdgoc_sch < database/seed_sim.sql   # 모의투자 종목 (재실행 안전)
mysql -u root -p gdgoc_sch < database/seed_adv.sql   # 심화 교육 + 뉴스 카드 (빈 DB에 1회)
```

시나리오 모드용 과거 시세는 업비트 API에서 받아 적재합니다 (백엔드 `.env` 설정 후).

```bash
cd backend && node scripts/load_scenario.js   # 시나리오 2종, 재실행 안전
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

## 현재 구현 상태 (P4)

- 회원가입 / 로그인 (JWT) — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- 투자 성향 설문 (10문항, 5단계 분류) — `GET /api/survey/questions`, `POST /api/survey/submit`
- 교육: 4개 챕터, 12개 레슨, 레슨/종합 퀴즈, XP/레벨, 용어사전
- 모의투자(라이브): 업비트 실시세 미러링 6종목, 시장가/지정가(Lv3+) 주문,
  에스크로 방식 미체결 관리, 포트폴리오 평가, 리더보드 — `/api/sim/*`
- 시나리오 모드(Lv3+): 실제 과거 일봉 리플레이(종목명 익명), 시간 전진(tick),
  당시 뉴스 카드, 완주 시 종목 공개 + B&H 벤치마크 복기 리포트 + XP
- AI 어시스턴트: 성향별 페르소나(Gemini 무료 티어, 키 없으면 stub),
  포트폴리오 컨텍스트 주입 채팅, 규칙 기반 상황 개입 코멘트 — `/api/assistant/*`
- 심화 교육(Lv5+): 기사/리포트/재무제표 독해 지문 + 이해도 퀴즈 — `/api/adv/*`
- 레벨 차등: 시드머니 Lv1=100만/Lv3=500만/Lv5=1,000만, 지정가 Lv3+,
  시나리오 Lv3+/Lv5+, 심화 Lv5+

세부 로드맵과 설계는 [docs/PLAN.md](docs/PLAN.md)를 참고하세요.
