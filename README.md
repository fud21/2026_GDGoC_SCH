# 2026_GDGoC_SCH

솔루션 챌린지 프로젝트 Repository입니다.

## 프로젝트 구조

```
frontend/   React (Vite)
backend/    Node.js (Express)
database/   MySQL 스키마 (schema.sql)
```

## 실행 방법

### 1. 데이터베이스

MySQL에 접속해서 스키마를 실행합니다.

```bash
mysql -u root -p < database/schema.sql
```

### 2. 백엔드

```bash
cd backend
cp .env.example .env   # DB 접속 정보 입력
npm install
npm run dev             # http://localhost:4000
```

### 3. 프론트엔드

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```
