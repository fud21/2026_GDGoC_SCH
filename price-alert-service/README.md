# Price Alert Service

상품 가격을 추적하고 원하는 조건에 맞춰 알림을 제공하는 서비스입니다.

## 기술 스택

- 프론트엔드: React Native, Expo, React Navigation
- 백엔드: Spring Boot, Spring Web, Spring Data JPA, Jsoup(크롤링), Spring Scheduler
- 데이터베이스: 개발용 H2(인메모리), 운영 전환용 MySQL 8.4
- 인프라: Docker Compose(MySQL)

## 주요 기능 API

| 기능 | 메서드 | 경로 |
| --- | --- | --- |
| 서버 상태 확인 | GET | `/api/health` |
| 회원가입 | POST | `/api/auth/signup` |
| 로그인 | POST | `/api/auth/login` |
| 로그아웃 | POST | `/api/auth/logout` |
| 등록 전 현재가 확인 | POST | `/api/price-check/preview` |
| 관심 상품 등록(등록 시 현재가 크롤링) | POST | `/api/products` |
| 상품 목록 조회 | GET | `/api/products` |
| 목표 가격 수정 | PATCH | `/api/products/{id}/target-price` |
| 상품 알림 ON/OFF 수정 | PATCH | `/api/products/{id}/alert-enabled` |
| 상품 삭제 | DELETE | `/api/products/{id}` |
| 가격 변동 이력(그래프용) | GET | `/api/products/{id}/price-history` |
| 알림 내역 조회(최신순) | GET | `/api/alerts` |
| 알림 읽음 처리 | PATCH | `/api/alerts/{id}/read` |
| 가격 즉시 재체크(개발용) | POST | `/api/price-check` |

가격 체크 스케줄러는 30분마다 `alertEnabled=true` 상품을 재크롤링하여
`현재가 <= 목표가` 이면 알림을 생성합니다. 크롤링 실패 상품은 로그만 남기고 스킵합니다.

> 기본 프로파일은 MySQL입니다. 실행 전 `docker compose up -d`로 로컬 MySQL을 먼저 띄워야 합니다.
> H2(인메모리)로 실행하려면 `application.yml`의 `spring.profiles.active: mysql`을 주석 처리하거나,
> `./gradlew bootRun --args='--spring.profiles.active='` 처럼 프로파일을 비워서 실행합니다.
> H2 콘솔: `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:price_tracker`).

## 프로젝트 구조

```text
price-alert-service/
├── backend/            # Spring Boot API 서버
├── frontend/           # Expo React Native 앱
└── docker-compose.yml  # 로컬 MySQL
```

## 개발 실행

### 환경 변수

```bash
cp .env.example .env
```

`.env` 파일에 로컬 개발에 사용할 데이터베이스 계정 정보를 입력합니다.

### 데이터베이스

```bash
docker compose up -d
```

로컬 MySQL은 `.env`에 설정한 데이터베이스 이름과 계정 정보를 사용합니다.

### 백엔드

```bash
cd backend
./gradlew bootRun
```

백엔드는 `http://localhost:8080`에서 실행됩니다.

### 프론트엔드

```bash
cd frontend
npm install
npm start
```

Expo 개발 서버를 실행한 뒤 에뮬레이터, 시뮬레이터 또는 Expo Go에서 앱을 확인합니다.

## API 설정

프론트엔드는 실행 플랫폼에 따라 개발용 API 주소를 자동으로 선택합니다.

| 플랫폼 | API 주소 |
| --- | --- |
| Web | `http://localhost:8080` |
| iOS 시뮬레이터 | `http://localhost:8080` |
| Android 에뮬레이터 | `http://10.0.2.2:8080` |
| 실제 기기 | Expo 개발 서버 호스트 IP와 `8080` 포트 |

필요한 경우 API 주소를 직접 지정할 수 있습니다.

```bash
EXPO_PUBLIC_API_URL=http://your-host:8080 npm start
```

## 검증

백엔드 테스트:

```bash
cd backend
./gradlew test
```

프론트엔드 타입 검사:

```bash
cd frontend
npx tsc --noEmit
```
