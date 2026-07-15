# 투자 교육 · 모의투자 플랫폼 — 기획/설계 문서 (v0.1 초안)

> 2026 GDGoC SCH 솔루션 챌린지 프로젝트.
> 금융 초보자가 **용어 학습 → 퀴즈/레벨업 → 모의투자 실전 연습**으로 이어지는
> 학습 루프를 완성하고, 개인 투자 성향에 맞춘 AI 어시스턴트가 동행하는 서비스.

---

## 1. 서비스 개요

### 1.1 타깃 사용자
- 투자를 시작하고 싶지만 용어부터 막히는 20대 초반 (대학생 중심)
- 유튜브/커뮤니티 글을 읽어도 은어("물타기", "존버", "숏") 때문에 이해가 안 되는 초보자

### 1.2 핵심 루프 (Core Loop)
```
학습 (챕터별 레슨)
  → 퀴즈 통과 → XP 획득 → 레벨업
    → 시뮬레이션 기능 해제 (시드머니 증가, 새 시나리오, 고급 주문)
      → 시뮬레이션 중 모르는 용어 등장 → 용어사전/AI에게 질문 → 다시 학습
```
교육과 시뮬레이션이 서로를 끌어주는 구조가 차별점. "공부하면 게임(모의투자)이 풀린다."

### 1.3 안전 고지 (필수)
- 모든 화면에 "본 서비스는 교육 목적의 모의투자이며 실제 투자 권유가 아닙니다" 고지
- AI 어시스턴트 응답에도 특정 종목 매수/매도 권유 금지 가드레일 적용

---

## 2. 기능 명세

### 2.1 투자 교육 (기본 코스)

**챕터 구성 (4개):**

| # | 챕터 | 내용 예시 |
|---|------|----------|
| 1 | 경제 | 금리, 인플레이션, 환율, GDP, 경기순환 |
| 2 | 금융 | 예적금 vs 투자, 채권, 펀드/ETF, 복리, 분산투자 |
| 3 | 주식 | 시가총액, PER/PBR/ROE, 배당, 공모주, 호가/체결, 재무제표 기초 |
| 4 | 투자 은어 | 물타기, 불타기, 존버, 손절/익절, 숏/롱, 개미/기관/외인, 서킷브레이커 |

**구조:** 챕터 → 레슨(개념 카드 3~5장 + 실생활 예문) → 레슨 퀴즈(4지선다/OX 3~5문항)

- 챕터는 순서 강제 없이 자유 선택 (요구사항: "원하는 챕터를 선택해서 학습")
- 레슨 완료 시 XP, 퀴즈 정답률에 따라 보너스 XP
- 챕터별 마지막에 **종합 퀴즈** (10~15문항) — 심화 교육 해제 조건에 사용
- **용어 사전(Glossary)**: 전체 용어 검색 + 챕터 필터. 시뮬레이션 화면에서 용어 롱프레스/클릭 시 사전 팝업

**AI 활용 포인트:**
- 오답 시 눈높이 해설 생성 ("고등학생에게 설명하듯이")
- 용어 사전에서 "더 쉽게 설명해줘" / "예시 들어줘" 버튼

### 2.2 심화 교육 (잠금 해제형)

**해제 조건 (제안):** 4개 챕터 종합 퀴즈 모두 80점 이상 **또는** 레벨 5 도달

**콘텐츠 유형:**
1. **기사 독해**: 실제 경제 기사(또는 각색본) 제시 → 핵심 용어 하이라이트 → 이해도 문항
2. **재무제표 읽기**: 실제 공시 데이터 기반 (한국 기업이면 DART OpenAPI 무료) — 매출/영업이익/부채비율 등을 표로 제시하고 "이 기업의 수익성은?" 유형 문항
3. **애널리스트 보고서 요약본**: 증권사 리포트 스타일 지문 → 투자포인트/리스크 구분 문항

콘텐츠 제작 부담이 크므로 **MVP에서는 유형별 2~3세트만** 수작업 제작하고, Gemini/LLM으로 문항 초안을 생성 후 사람이 검수하는 파이프라인 권장.

### 2.3 투자 시뮬레이션 (레벨 차등)

**모드 A — 과거 데이터 리플레이 (시나리오 모드)**
- 특정 역사적 구간(예: 2020 급락장→회복, 2021 상승장, 2022 금리인상기)을 **압축 재생** (1주일 = 몇 분)
- **종목명 익명화** ("A전자", "B바이오") — 유저가 결과를 미리 알고 플레이하는 것 방지. 종료 후 실제 종목/기간 공개 + 복기 리포트
- 시나리오 종료 시 수익률/최대낙폭(MDD) 기반 평가 + XP

**모드 B — 가상 코인 실시간 모드**
- 상시 열려있는 연습장. 두 가지 구현 옵션:
  - **B-1 (권장)**: 실제 코인 시세 미러링 (업비트 공개 REST/WebSocket, 인증 불필요) + 가상 잔고. 구현이 쉽고 현실감 최고
  - B-2: 서버가 가격 생성 (GBM + 랜덤 이벤트 주입). 외부 의존 없음, 대신 현실감↓
- 가상 시드머니로 매수/매도, 포트폴리오/손익 실시간 표시, 주간 리더보드

**레벨 차등 (제안):**

| 레벨 | 해제 내용 |
|------|----------|
| Lv 1 | 가상 코인 모드, 시드 100만, 시장가 주문만 |
| Lv 3 | 지정가 주문, 시드 500만, 시나리오 모드 1개 해제 |
| Lv 5 | 심화 교육, 시나리오 전체, 시드 1,000만 |
| Lv 7+ | 리더보드 시즌 참가, (선택) 분할매수 자동주문 등 고급 기능 |

### 2.4 회원가입 · 성향 조사 · AI 어시스턴트

**가입 시 수집:** 이메일, 비밀번호, 이름, 출생연도(나이 대신 — 시간이 지나도 유효), 성별(선택 항목 권장)

**성향 조사:** 가입 직후 8~12문항 설문 (투자 경험, 손실 감내도, 투자 기간, 목적)
→ 점수 합산 → **금융권 표준 5단계 분류**: 안정형 / 안정추구형 / 위험중립형 / 적극투자형 / 공격투자형
→ 재검사 가능 (마이페이지)

**맞춤 AI 어시스턴트:**
- 성향별 페르소나 시스템 프롬프트 (예: 안정형 → "신중한 리스크 관리 코치", 공격형 → "냉정한 리스크 점검 파트너" — 공격 성향을 부추기지 않고 균형을 잡아주는 방향)
- 시뮬레이션 화면 사이드 패널 채팅 + 상황 개입 코멘트:
  - 포트폴리오가 한 종목에 80% 이상 집중 → 분산 코멘트
  - 안정형 유저가 변동성 큰 자산에 몰빵 → 성향 대비 경고
  - 급락 시 패닉셀 직전 → "손절 기준을 정해뒀나요?" 류의 질문형 코칭
- 컨텍스트: 사용자 성향 + 현재 포트폴리오 + 최근 거래 + 시세 요약을 프롬프트에 주입
- **가드레일**: 특정 종목 추천 금지, 수익 보장 표현 금지, 교육 목적 고지 자동 포함

**페르소나 프롬프트 예시 (안정형):**
```
너는 '차분한 리스크 관리 코치'다. 사용자는 안정형 투자 성향으로 분류되었다.
- 변동성과 손실 가능성을 항상 먼저 짚는다
- 분산투자, 손절 기준, 현금 비중을 자주 언급한다
- 특정 종목의 매수/매도를 직접 권유하지 않는다. 판단 기준을 알려주는 방식으로만 답한다
- 모든 답변은 3문장 이내, 존댓말, 마지막에 생각해볼 질문 하나를 던진다
```

---

## 3. 시스템 아키텍처

```
[React SPA (Vite)] ── REST /api/* ──> [Express API] ──> [MySQL]
        │                                  │
        │  (시세 폴링 or WebSocket)         ├──> [LLM API (Gemini or Claude)]  ← AI 어시스턴트/해설
        └──────────────────────────────────┼──> [업비트 공개 API]              ← 실시간 시세 미러링
                                           └──> [과거 시세 데이터 (CSV→DB 적재)] ← 시나리오 모드
```

- **인증**: JWT (액세스 토큰) + bcrypt 해시. GDGoC 특성상 Google OAuth 추가 고려
- **실시간 시세**: MVP는 **5초 폴링**으로 충분. 이후 WebSocket 업그레이드
- **LLM**: 솔루션 챌린지 규정상 Google 기술 요구되면 **Gemini API**, 규정 무관하면 Claude도 가능 → **규정 확인 필요 (결정 필요 사항 #1)**
- **배포**: GCP (Cloud Run + Cloud SQL) 가 챌린지 문맥에 자연스러움

---

## 4. DB 스키마 (제안)

```sql
-- 기존 users 확장
ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) NOT NULL,
  ADD COLUMN birth_year SMALLINT NULL,
  ADD COLUMN gender ENUM('M','F','X') NULL,          -- X: 선택 안 함
  ADD COLUMN risk_type ENUM('안정형','안정추구형','위험중립형','적극투자형','공격투자형') NULL,
  ADD COLUMN xp INT NOT NULL DEFAULT 0,
  ADD COLUMN level TINYINT NOT NULL DEFAULT 1;

-- 성향 조사 이력
CREATE TABLE risk_surveys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  answers JSON NOT NULL,             -- [{qid, choice}]
  score INT NOT NULL,
  risk_type ENUM('안정형','안정추구형','위험중립형','적극투자형','공격투자형') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 교육
CREATE TABLE chapters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,  -- economy | finance | stock | slang
  title VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL
);

CREATE TABLE lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chapter_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content MEDIUMTEXT NOT NULL,       -- Markdown (개념 카드들)
  sort_order INT NOT NULL,
  xp_reward INT NOT NULL DEFAULT 10,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

CREATE TABLE quiz_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NULL,                -- NULL이면 챕터 종합퀴즈 문항
  chapter_id INT NOT NULL,
  qtype ENUM('MC','OX') NOT NULL,
  question TEXT NOT NULL,
  choices JSON NULL,                 -- MC: ["보기1", ...]
  answer VARCHAR(255) NOT NULL,
  explanation TEXT,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

CREATE TABLE user_lesson_progress (
  user_id INT NOT NULL,
  lesson_id INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE user_quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  chosen VARCHAR(255) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE glossary_terms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chapter_id INT NOT NULL,
  term VARCHAR(100) NOT NULL,
  definition TEXT NOT NULL,
  example TEXT
);

-- 심화 교육
CREATE TABLE adv_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mtype ENUM('article','report','financial_stmt') NOT NULL,
  title VARCHAR(200) NOT NULL,
  body MEDIUMTEXT NOT NULL,
  meta JSON NULL,                    -- 출처, 기업명, 기간 등
  min_level TINYINT NOT NULL DEFAULT 5
);
-- 심화 문항은 quiz_questions에 material_id 컬럼을 추가하거나 별도 테이블로 (구현 시 결정)

-- 시뮬레이션
CREATE TABLE instruments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mode ENUM('historical','live') NOT NULL,
  symbol VARCHAR(30) NOT NULL,       -- live: KRW-BTC 등 / historical: 실제 티커
  display_name VARCHAR(100) NOT NULL,-- historical은 익명명 ("A전자")
  real_name VARCHAR(100) NULL        -- 종료 후 공개용
);

CREATE TABLE price_candles (         -- 시나리오 모드용 과거 OHLCV
  instrument_id INT NOT NULL,
  ts DATETIME NOT NULL,
  open DECIMAL(18,4), high DECIMAL(18,4), low DECIMAL(18,4), close DECIMAL(18,4),
  volume BIGINT,
  PRIMARY KEY (instrument_id, ts)
);

CREATE TABLE scenarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,       -- "2020 폭락과 회복"
  description TEXT,
  start_ts DATETIME NOT NULL,
  end_ts DATETIME NOT NULL,
  min_level TINYINT NOT NULL DEFAULT 3,
  instrument_ids JSON NOT NULL
);

CREATE TABLE sim_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mode ENUM('historical','live') NOT NULL,
  scenario_id INT NULL,
  seed_money DECIMAL(18,2) NOT NULL,
  cash DECIMAL(18,2) NOT NULL,
  status ENUM('active','ended') NOT NULL DEFAULT 'active',
  sim_clock DATETIME NULL,           -- 시나리오 모드의 가상 현재 시각
  final_return DECIMAL(8,4) NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL
);

CREATE TABLE sim_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  instrument_id INT NOT NULL,
  side ENUM('BUY','SELL') NOT NULL,
  order_type ENUM('MARKET','LIMIT') NOT NULL,
  qty DECIMAL(18,8) NOT NULL,
  price DECIMAL(18,4) NULL,          -- LIMIT일 때
  status ENUM('filled','open','cancelled') NOT NULL,
  executed_price DECIMAL(18,4) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sim_holdings (
  session_id INT NOT NULL,
  instrument_id INT NOT NULL,
  qty DECIMAL(18,8) NOT NULL,
  avg_price DECIMAL(18,4) NOT NULL,
  PRIMARY KEY (session_id, instrument_id)
);

-- AI 어시스턴트
CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sim_session_id INT NULL,
  role ENUM('user','assistant') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- XP 이력 (레벨 재계산/부정 방지용 원장)
CREATE TABLE xp_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  reason VARCHAR(100) NOT NULL,      -- lesson_complete:12, quiz_pass:3, ...
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. API 설계 (REST, `/api` prefix)

| 영역 | 메서드/경로 | 설명 |
|------|-------------|------|
| 인증 | `POST /auth/register` | 가입 (이메일, pw, 이름, 출생연도, 성별) |
| | `POST /auth/login` | JWT 발급 |
| | `GET /auth/me` | 내 정보 + 레벨/XP/성향 |
| 성향 | `GET /survey/questions` | 설문 문항 |
| | `POST /survey/submit` | 답변 제출 → risk_type 반환 |
| 교육 | `GET /edu/chapters` | 챕터 목록 + 내 진행률 |
| | `GET /edu/lessons/:id` | 레슨 콘텐츠 + 퀴즈 |
| | `POST /edu/lessons/:id/complete` | 완료 처리 + XP |
| | `POST /edu/quiz/submit` | 퀴즈 채점 + 해설 + XP |
| | `GET /edu/glossary?q=` | 용어 검색 |
| 심화 | `GET /adv/materials` | 잠금 상태 포함 목록 |
| | `GET /adv/materials/:id` | 지문 + 문항 (레벨 검사) |
| 시뮬 | `POST /sim/sessions` | 세션 시작 (mode, scenario_id) |
| | `GET /sim/sessions/:id` | 포트폴리오/손익/시계 |
| | `POST /sim/sessions/:id/orders` | 주문 (레벨별 order_type 제한) |
| | `GET /sim/prices?symbols=` | 현재가 (live: 업비트 프록시 / hist: sim_clock 기준) |
| | `POST /sim/sessions/:id/tick` | (시나리오) 시간 전진 |
| | `GET /sim/leaderboard` | 주간 수익률 랭킹 |
| AI | `POST /assistant/chat` | 채팅 (성향+포트폴리오 컨텍스트 주입, SSE 스트리밍) |
| | `GET /assistant/nudge?session=` | 상황 개입 코멘트 (집중도/변동성 룰 트리거) |

---

## 6. 프론트엔드 화면 구성

| 화면 | 내용 |
|------|------|
| 랜딩/로그인/가입 | 가입 → 성향 설문 온보딩 플로우 |
| 홈 대시보드 | 레벨/XP 바, 이어서 학습하기, 진행 중인 시뮬, 오늘의 용어 |
| 교육 허브 | 4챕터 카드 (진행률 링), 챕터 → 레슨 리스트 → 레슨 뷰(카드 스와이프) → 퀴즈 |
| 용어 사전 | 검색 + 챕터 필터, AI "더 쉽게" 버튼 |
| 심화 교육 | 잠금/해제 상태 표시, 지문 뷰어 + 문항 |
| 시뮬레이션 | 종목 리스트, 차트(lightweight-charts), 주문 패널, 포트폴리오 탭, AI 사이드 패널 |
| 시나리오 선택 | 난이도/최소레벨 표시, 종료 후 복기 리포트 |
| 리더보드 | 주간 수익률 랭킹 |
| 마이페이지 | 성향 재검사, 학습 통계, 시뮬 기록 |

**추가 라이브러리 제안:** `react-router-dom`, `@tanstack/react-query`, `lightweight-charts`, `zustand`(필요시)

---

## 7. 레벨/XP 규칙 (제안)

| 행동 | XP |
|------|----|
| 레슨 완료 | 10 |
| 레슨 퀴즈 전문항 정답 | +5 보너스 |
| 챕터 종합퀴즈 80점↑ | 50 |
| 시나리오 완주 | 30 (+수익률 상위 보너스) |
| 일일 첫 접속 | 5 |

레벨 곡선: `필요 XP = 50 × level × (level+1) / 2` (Lv2=150, Lv3=300, Lv5=750, Lv7=1400 누적)
→ 4챕터를 성실히 끝내면 자연스럽게 Lv5(심화 해제)에 도달하도록 콘텐츠 양과 맞춰 튜닝.

---

## 8. 개발 로드맵 (4 Phase)

| Phase | 산출물 | 병렬 분업 단위 |
|-------|--------|---------------|
| **P0 기반** (1~2주) | 스키마 마이그레이션, JWT 인증, 라우터/레이아웃, 공통 UI | BE 인증 / FE 레이아웃 / DB·시드 데이터 |
| **P1 교육 MVP** (2주) | 4챕터 콘텐츠(챕터당 레슨 3~5개), 퀴즈, XP/레벨, 용어사전 | 콘텐츠 제작 / 교육 API / 교육 UI |
| **P2 시뮬 MVP** (2~3주) | 가상 코인 모드(업비트 미러링), 시장가 주문, 포트폴리오, 차트 | 시세 프록시 / 주문·체결 로직 / 시뮬 UI |
| **P3 AI + 성향** (2주) | 성향 설문, 페르소나 어시스턴트, 상황 개입 코멘트 | 설문+분류 / LLM 연동 / 채팅 UI |
| **P4 심화** (여유 시) | 시나리오 모드(과거 데이터), 심화 교육, 리더보드, 복기 리포트 | 데이터 적재 / 시나리오 엔진 / 심화 콘텐츠 |

P1과 P2는 API 계약(5장)만 먼저 합의하면 팀 브랜치(TEAM1~5)로 병렬 진행 가능.

---

## 9. 확정된 결정 사항 (2026-07-15)

1. **LLM**: **무료 티어 우선** — 기본은 Gemini API 무료 티어(Google AI Studio 발급 키, `gemini-2.5-flash` 계열). 다른 무료 LLM(예: Groq 무료 티어, 로컬 오픈모델)도 허용. LLM 호출부는 provider 교체가 쉽게 어댑터 계층으로 분리해 구현
2. **시뮬 대상 자산**: **코인만 우선**. 주식 확장은 추후 검토
3. **가상 코인 구현**: **B-1 실시세 미러링** (업비트 공개 API + 가상 잔고)
4. **과거 데이터**: 과거 시세는 업비트 API로 수집해 `price_candles`에 적재. 기사는 저작권 문제로 **원문 대신 "당시 상황 요약 카드"를 자체 작성**(LLM 초안 + 팀 검수)하고 출처 링크만 표기 (`articles` 테이블 사용)
5. **배포 타깃**: **최대한 무료 티어로 커버** — Cloud Run 무료 티어 + DB는 무료 옵션(무료 VM에 MySQL 자체 호스팅 또는 GCP 크레딧 활용). 프론트는 모바일 우선 반응형으로 설계하고, 추후 **Capacitor로 래핑해 앱스토어 출시** 경로 확보 (React 코드 재사용)
6. **수익화(추후)**: 소액 결제(인앱 결제 — 시드머니 추가, 프리미엄 시나리오 등)는 앱 출시 단계에서 검토. MVP에는 결제 미포함, DB 설계만 확장 가능하게 유지
7. 성별 수집: 선택 항목으로 수집 (개인정보 최소 수집 원칙)

## 10. 리스크

- **콘텐츠 제작량**이 최대 병목 — 레슨/퀴즈/심화 지문은 LLM 초안 + 사람 검수로 속도 확보
- 업비트 API 장애/제한 대비 → 시세 프록시에 캐시 + 폴백(마지막 가격 유지) 필수
- LLM 비용/쿼터 — 어시스턴트 응답 길이 제한, 컨텍스트 요약 주입으로 토큰 절약
- 금융 서비스 오인 방지 — 교육 목적 고지 및 AI 가드레일은 P3에서 처음부터 포함
