# 2026_GDGoC_SCH

솔루션 챌린지 프로젝트 Repository입니다.

## 프로젝트 구조

- `frontend/` : React (Vite)
- `backend/` : Node.js (Express) + Prisma ORM + SQLite

## 실행 방법

처음 한 번만:

```
npm run install:all
```

두 서버를 동시에 실행:

```
npm run dev
```

- 백엔드: http://localhost:4000
- 프론트엔드: http://localhost:5173

개별 실행도 가능합니다.

```
npm run dev:backend
npm run dev:frontend
```

## 데이터베이스 (Prisma + SQLite)

DB 파일은 `backend/prisma/dev.db` 입니다. 스키마는 `backend/prisma/schema.prisma`에서 관리합니다.
## 🔄 데이터 흐름도 (Data Flow Diagram)

1. **사용자 요청**: 사용자가 검색할 주소 입력 (Frontend: React, Kakao Map)
2. **주소-좌표 변환**: Backend(Node.js)에서 요청 수신 후 Kakao API를 통해 위/경도 좌표로 변환
3. **DB 데이터 조회**: MySQL Database에서 변환된 좌표 기준 안전 시설물(CCTV, 보안등, 파출소) 및 범죄 통계 데이터 조회
4. **안전 점수 계산**: 
   - 평가 항목: CCTV 개수, 보안등 개수, 파출소 거리, 범죄 발생 건수
   - 가중치 적용 (60% / 20% / 20%)
   - 최종 S~D 등급 산출
5. **API 응답 및 시각화**: 산출된 안전 점수/등급/시설 정보를 Frontend로 전달하여 히트맵 및 위치 표시

- 스키마 수정 후 마이그레이션: `cd backend && npm run prisma:migrate`
- Prisma 클라이언트 재생성: `cd backend && npm run prisma:generate`
- DB GUI로 데이터 보기: `cd backend && npm run prisma:studio`

## API 명세

### `GET /api/health`

서버가 살아있는지 확인하는 헬스체크용 엔드포인트.

- 응답: `{ "status": "ok" }`

### `GET /api/users` / `POST /api/users`

`User` 모델 CRUD 동작 검증용으로 초기 세팅 때 추가한 API. 최신 사용자순으로 조회하거나, 이메일/이름을 받아 새 사용자를 생성한다.

- `GET`: 응답은 `User[]` (id, email, name, createdAt)
- `POST`: 요청 예시 `{ "email": "a@a.com", "name": "홍길동" }` — `email`이 없으면 400, 있으면 201과 함께 생성된 사용자 반환

### `GET /api/safety-data`

관악구 CCTV/보안등/파출소/범죄통계 원본 데이터(`SafetyData` 테이블)를 그대로 조회하는 API. 지도 시각화나 통계용으로 프론트에서 원본 데이터가 필요할 때 사용.

- 쿼리
  - `dataType` — `cctv` | `보안등` | `파출소` | `범죄통계` (생략 시 전체)
  - `page` (기본 1), `pageSize` (기본 50, 최대 200)
- 응답: `{ total, page, pageSize, items }` — `items`는 위/경도, CCTV 대수, 보안등 종류 등 CSV 원본 컬럼을 그대로 담은 레코드 배열
- 예시: `GET /api/safety-data?dataType=cctv&page=1&pageSize=50`

### `GET /api/safety-score?address=...`

주소를 입력하면 그 지점의 실시간 안전점수/등급을 계산해 주는 핵심 API (Phase 1, 반경 기반). "이 주소 근처가 얼마나 안전한가"를 CCTV·보안등 밀집도로 정량화하는 역할을 한다.

내부 처리 흐름:

1. **지오코딩**: `address`를 Kakao 주소 검색 API로 위/경도 좌표로 변환한다.
2. **범위 판별**: 변환된 좌표가 관악구 21개 동 경계(`gwanak_dong_boundary.geojson`) 안에 있는지 turf.js의 point-in-polygon으로 확인한다. 범위 밖이면 422로 응답하고 계산을 진행하지 않는다.
3. **시설 카운트**: 관악구 내(`isGwanak=true`) CCTV/보안등 데이터를 서버가 메모리에 캐싱해두고(요청마다 DB 왕복하지 않기 위함), 입력 좌표 기준 반경 300m 안에 있는 CCTV 개수와 보안등 개수를 실시간으로 센다.
4. **정규화**: 센 개수를 `safety_score_config.json`에 저장된 min/max 기준(관악구 100m 격자 샘플링으로 산출)으로 0~100점으로 클리핑 정규화한다.
5. **가중합 및 등급화**: CCTV 점수 60% + 보안등 점수 40%로 최종 점수를 합산하고, `gradeCutoffs` 기준값과 비교해 S~D 5등급 중 하나를 매긴다.

- 쿼리: `address` (필수)
- 응답 예시:
  ```json
  {
    "address": "서울특별시 관악구 신림동 ...",
    "lat": 37.48,
    "lng": 126.93,
    "grade": "A",
    "score": 70.7,
    "details": { "radiusMeters": 300, "cctvCount": 12, "lampCount": 45 },
    "meta": { "phase": 1, "method": "radius", "note": "..." }
  }
  ```
- 에러 응답
  - `400` — `address` 쿼리 누락
  - `404` — Kakao 지오코딩 결과 없음 (존재하지 않는 주소)
  - `422` — 좌표는 나왔지만 관악구 범위 밖인 주소
  - `500` — 그 외 서버 오류
- 관련 코드: `backend/src/routes/safety.routes.js`(지오코딩·범위 판별·라우트 등록), `backend/src/controllers/safety.controller.js`(요청 처리), `backend/src/services/score.service.js`(카운트·정규화·등급 계산), `backend/src/utils/distance.js`(거리 계산)
- 주의: 아직 `axios`/`@turf/turf` 미설치 및 `app.js` 라우트 미등록, `KAKAO_API_KEY` 미설정 상태라 실제 호출은 안 된다 (자세한 내용은 "진행 상황" 4번, "다음에 이어서 할 수 있는 것" 참고)

## 관악구 안전데이터 (CSV 임포트)

CCTV/보안등/파출소/범죄통계가 통합된 CSV(`backend/prisma/data/gwanak_safety_data.csv`)를 `SafetyData` 테이블로 가져옵니다.

```
cd backend && npm run import:safety-data
```

재실행하면 기존 데이터를 지우고 다시 채웁니다.

## 진행 상황

### 1. 프로젝트 초기 세팅 (모노레포)

- 백엔드: Express + Prisma ORM + SQLite (`backend/prisma/dev.db`)
  - 처음엔 최신 Prisma 7이 자동 설치됐는데 드라이버 어댑터 강제 등 구조가 크게 바뀌어 있어, 안정 버전인 Prisma 6.19.3으로 맞춰 세팅
  - `User` 모델, API: `GET /api/health`, `GET/POST /api/users`
- 프론트엔드: Vite + React
  - `/api/users` 호출해서 목록 조회 + 등록 폼 구현
  - `.env`의 `VITE_API_BASE_URL`로 백엔드 주소 지정
- 두 서버를 실제로 띄워서 사용자 생성 → 조회까지 curl로 동작 검증 완료

### 2. 관악구 안전데이터 CSV → DB 임포트

- 카카오톡으로 받은 `관악구_안전데이터_통합 (1).csv` (CCTV/보안등/파출소/범죄통계 통합, 15,399행)를 `backend/prisma/data/gwanak_safety_data.csv`로 프로젝트에 복사
- Prisma 스키마에 `SafetyData` 모델 추가 (원본 CSV 컬럼 구조를 그대로 반영: dataType, sourceId, name, address, lat/lng, cctv/lamp/police/crime 관련 필드 등)
- 임포트 스크립트 `backend/prisma/importSafetyData.js` (`npm run import:safety-data`)
  - CSV BOM 제거, 주소 필드 안 쉼표 등을 정확히 처리하는 CSV 파서(csv-parse) 사용
- 15,399건 전량 저장 완료 — cctv 2,106 / 보안등 13,283 / 파출소 9 / 범죄통계 1 (원본과 정확히 일치 확인)
- 확인용 API 추가: `GET /api/safety-data?dataType=...&page=...&pageSize=...`

### 3. 관악구 데이터 행정동 코드(dong_code) 매핑

- 기존 `gwanak_safety_data.csv`(15,399건)에 행정동 코드 관련 컬럼 4개 추가
  - `dong_code` (10자리 행정기관코드)
  - `dong_name` (동 이름, 예: 신림동)
  - `sgg_code` (5자리 구 코드, 관악구는 `11620`)
  - `is_gwanak` (좌표가 실제 관악구 행정동 경계 안인지 boolean)
- `vuski/admdongkor`(GitHub) 전국 행정동 경계 GeoJSON을 기준으로 point-in-polygon 매칭 수행
- 좌표가 있는 15,389건 전부 동 코드 매칭 완료 (파출소 9건 + 범죄통계 1건은 원본에 위경도가 없어 매칭 불가, 별도 지오코딩 필요)
- 45건(cctv 9 + 보안등 36)은 주소는 관악구지만 실제 좌표가 동작구/금천구/과천시 경계에 걸쳐있는 것으로 확인 (`is_gwanak=false`로 분리 처리, 삭제하지 않고 원본 보존)
- Prisma 스키마(`SafetyData` 모델)에 `dongCode`, `dongName`, `sggCode`, `isGwanak` 필드 추가 및 마이그레이션 완료, 재임포트 후 건수 검증 완료

### 4. 안전점수 계산 로직 및 API (Phase 1)

- 방식: 동 단위 사전 계산이 아니라, 입력 좌표 기준 반경 실시간 계산 방식으로 설계 (같은 동 안에서도 위치별로 점수가 달라짐)
- 계산 흐름: 주소 입력 → Kakao 지오코딩(좌표 변환) → 관악구 경계 판별(turf.js) → 반경 300m 내 CCTV/보안등 개수 집계 → 정규화(0~100) → 가중합(CCTV 60% + 보안등 40%) → S~D 5등급 산출
- 정규화 기준값은 관악구 내부 100m 격자(약 3,762개 지점) 샘플링으로 산출 (5~95 백분위 기준)
- 현재는 Phase 1로 CCTV/보안등 밀도만 반영. 파출소 근접도·범죄 발생 데이터는 Phase 2로 예정 (아래 "다음에 이어서 할 수 있는 것" 참고)
- API: `GET /api/safety-score?address=...`
  - 응답 예시:
    ```json
    {
      "address": "서울특별시 관악구 신림동 ...",
      "lat": 37.48,
      "lng": 126.93,
      "grade": "A",
      "score": 70.7,
      "details": { "radiusMeters": 300, "cctvCount": 12, "lampCount": 45 },
      "meta": { "phase": 1, "method": "radius", "note": "..." }
    }
    ```
- 코드 구성 (프로젝트의 라우트/컨트롤러/서비스 구조에 맞춰 분리)
  - `backend/src/utils/distance.js` — 좌표 간 거리 계산
  - `backend/src/services/score.service.js` — 반경 내 카운트, 정규화, 등급 계산
  - `backend/src/routes/safety.routes.js` — Kakao 지오코딩, 관악구 범위 판별, 라우트 등록
  - `backend/src/controllers/safety.controller.js` — 요청 처리 핸들러
  - `backend/prisma/data/gwanak_dong_boundary.geojson` — 관악구 21개 동 경계 (범위 판별용)
  - `backend/prisma/data/safety_score_config.json` — 반경/가중치/정규화 기준값/등급 컷오프

### 다음에 이어서 할 수 있는 것

- [완료] 지도에 위경도 시각화 관련 기반 데이터(동 경계 geojson) 준비됨 — 실제 지도 렌더링은 프론트 작업 필요
- `npm install axios @turf/turf` 설치 및 `app.js`에 `/api/safety-score` 라우트 등록
- `.env`에 `KAKAO_API_KEY` 값 채우기
- 파출소 9건 좌표 지오코딩(Kakao API) 후 Phase 2 반영 준비
- 범죄 데이터 반영 방식 결정 (생활안전지도 API는 WMS 이미지 형식이라 동 단위 수치화가 까다로움 — 팀 논의 필요)
- 격자 정규화 재보정 검토 (현재 하위 20% 구간 점수가 0으로 몰리는 현상 있음, 필요시 샘플링 범위를 주거지역으로 조정)
- 사용자 인증
