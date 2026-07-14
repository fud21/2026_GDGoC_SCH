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

- 스키마 수정 후 마이그레이션: `cd backend && npm run prisma:migrate`
- Prisma 클라이언트 재생성: `cd backend && npm run prisma:generate`
- DB GUI로 데이터 보기: `cd backend && npm run prisma:studio`

## API 확인

```
GET  http://localhost:4000/api/health
GET  http://localhost:4000/api/users
POST http://localhost:4000/api/users   { "email": "a@a.com", "name": "홍길동" }
```
