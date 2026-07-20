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

## API 확인

```
GET  http://localhost:4000/api/health
GET  http://localhost:4000/api/users
POST http://localhost:4000/api/users   { "email": "a@a.com", "name": "홍길동" }
GET  http://localhost:4000/api/safety-data?dataType=cctv&page=1&pageSize=50
```

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

### 다음에 이어서 할 수 있는 것

- 지도에 위경도 시각화
- 데이터 타입별 통계 API
- 사용자 인증
