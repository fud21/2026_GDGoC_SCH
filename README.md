# StudyMate 프로젝트 개발 요약

## 프로젝트 개요
- **프로젝트명**: StudyMate (스터디메이트)
- **목적**: 순천향대학교(SCH) 학생들을 위한 스터디 모집 웹 애플리케이션
- **기술 스택**:
  - **백엔드**: Spring Boot 4.1.0, Java 17, H2 Database (파일 저장), Spring Security, Firebase Admin SDK
  - **프론트엔드**: React (create-react-app), Tailwind CSS, Axios, Firebase SDK
  - **인증**: Firebase Authentication (이메일/비밀번호)

---

## 프로젝트 구조

```
studymate/
├── studymate/  (Spring Boot 백엔드)
│   └── src/main/java/com/studymate/studymate/
│       ├── config/
│       │   ├── FirebaseConfig.java
│       │   └── SecurityConfig.java
│       ├── controller/
│       │   ├── AuthController.java
│       │   ├── StudyController.java
│       │   └── UserController.java
│       ├── dto/
│       │   ├── AuthRequest.java
│       │   ├── ProfileSummaryResponse.java
│       │   └── UserStudiesResponse.java
│       ├── entity/
│       │   ├── Study.java
│       │   └── User.java
│       ├── repository/
│       │   ├── StudyRepository.java
│       │   └── UserRepository.java
│       └── StudymateApplication.java
└── frontend/  (React 프론트엔드)
    └── src/
        ├── App.js
        └── firebase.js
```

---

## 핵심 설정

### application.properties
```properties
spring.application.name=studymate
spring.datasource.url=jdbc:h2:file:./data/studymatedb;AUTO_SERVER=TRUE
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.h2.console.enabled=true
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
firebase.config-path=classpath:firebase-service-account.json
```

### firebase.js
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
         sendEmailVerification, onAuthStateChanged, browserSessionPersistence, 
         setPersistence, signOut, deleteUser } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAyy_Rzo4_FK1YWL_dKRdQtzvxVYKzalf4",
  authDomain: "studymate-69ac7.firebaseapp.com",
  projectId: "studymate-69ac7",
  storageBucket: "studymate-69ac7.firebasestorage.app",
  messagingSenderId: "470233842626",
  appId: "1:470233842626:web:ce8aa1d1b0cae26f144c5b",
  measurementId: "G-5ZSXT92LM4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence);
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, 
         sendEmailVerification, onAuthStateChanged, signOut, deleteUser };
```

---

## 엔티티 구조

### User.java
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    private String id;       // Firebase UID
    private String email;
    private String name;
    private String department;
    private Integer grade;
    @Column(length = 1000000)
    private String profileImage;
}
```

### Study.java
```java
@Entity
@Table(name = "studies")
public class Study {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String category;
    @Column(length = 1000000)
    private String representativeImage;
    @Column(length = 2000)
    private String introduction;
    @Column(length = 1000)
    private String joinCondition;      // 참여 조건
    private String progressMethod;
    private String schedule;
    private String timeInfo;
    private String location;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private String status;             // 모집중, 마감
    private String creatorId;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> tagList = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> participantIds = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> pendingUserIds = new ArrayList<>();   // 승인 대기자

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> wishlistedUserIds = new ArrayList<>();
}
```

---

## API 목록

### AuthController `/api/auth`
| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/auth/sso` | Firebase 토큰 검증 후 유저 조회/생성 |

### UserController `/api/users`
| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/users/{id}/info` | 유저 정보 조회 |
| GET | `/api/users/{id}/profile` | 프로필 + 스터디 통계 조회 |
| GET | `/api/users/{id}/studies` | 유저의 스터디 목록 조회 |
| PUT | `/api/users/{id}/profile` | 프로필 수정 |
| DELETE | `/api/users/{id}` | 회원 탈퇴 (만든 스터디도 삭제) |

### StudyController `/api/studies`
| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/studies` | 스터디 목록 조회 (sort, status, keyword, category 필터) |
| POST | `/api/studies` | 스터디 생성 |
| GET | `/api/studies/{id}` | 스터디 상세 조회 |
| DELETE | `/api/studies/{id}` | 스터디 삭제 (방장만) |
| POST | `/api/studies/{id}/apply` | 스터디 신청 (대기열로 이동) |
| POST | `/api/studies/{id}/approve` | 신청 승인 (방장만) |
| POST | `/api/studies/{id}/reject` | 신청 거절 (방장만) |
| POST | `/api/studies/{id}/kick` | 강제 내보내기 (방장만) |
| POST | `/api/studies/{id}/wish` | 찜하기/취소 토글 |
| GET | `/api/studies/categories/stats` | 카테고리별 스터디 수 통계 |

---

## 주요 기능

### 인증
- `@sch.ac.kr` 이메일만 회원가입/로그인 가능
- 회원가입 시 Firebase 이메일 인증 필수
- 브라우저 세션 종료 시 자동 로그아웃 (`browserSessionPersistence`)
- 2시간 무활동 시 자동 로그아웃
- 새로고침 시 로그인 상태 유지 (`onAuthStateChanged`)

### 스터디 관리
- 스터디 생성: 제목, 카테고리, 대표이미지(선택), 소개, 참여조건, 진행방식, 일정(달력/상시모집), 시간(시간미정 옵션), 장소, 모집인원, 태그(최대 5개)
- 카테고리: 전공, 어학, 자격증, IT/프로그래밍, 취업, 기타
- 방장 권한: 신청 승인/거절, 강제 내보내기, 스터디 삭제
- 팀원 목록: 승인된 참여자만 볼 수 있음

### 마이페이지
- 프로필 수정 (이름, 학과, 학년, 프로필 사진)
- 내 스터디 / 찜한 스터디 / 신청 내역 통계
- 회원탈퇴 (Firebase + DB 동시 삭제)

### UI/UX
- 하단 고정 네비게이션 바 (홈, 검색, 만들기, 마이)
- 브라우저 뒤로가기 감지 (`popstate`) → 이전 페이지로 이동
- 인기 카테고리: 실제 스터디 수 기준으로 표시
- 로딩 화면 (`isLoading` state)

---

## 해결한 주요 버그

| 문제 | 원인 | 해결 |
|------|------|------|
| 서버 실행 안됨 | `StudyRepository`의 잘못된 반환타입 `List<List<Study>>` | `List<Study>`로 수정 |
| Firebase 초기화 실패 | `javax.annotation.PostConstruct` 사용 | `jakarta.annotation.PostConstruct`로 변경 |
| 로그인 후 500 오류 | Firebase 토큰(922자)을 ID로 저장 시도 | Firebase 토큰 검증 성공 후 UID 사용 |
| 스터디 생성 500 오류 | `participantIds` null 체크 누락 | null 체크 후 `new ArrayList<>()` 초기화 |
| 이미지 저장 실패 | `representativeImage` 컬럼 255자 제한 | `@Column(length = 1000000)` 추가 |
| `.contains()` 오류 | Java 메서드를 JS에서 사용 | `.includes()`로 변경 |

---

## 실행 방법

### 백엔드
```bash
cd studymate/studymate
./gradlew clean bootRun
# http://localhost:8080
```

### 프론트엔드
```bash
cd studymate/frontend
npm install
npm start
# http://localhost:3000
```

### H2 콘솔
- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/studymatedb`
- User Name: `SA`
- Password: (빈칸)

---

## 현재 미완성/추가 예정 기능
- 프로필 수정 PUT API 405 오류 해결 필요
- 팀원 목록 이름 표시 (`/api/users/{id}/info` API 연동)
- 스터디 삭제 버튼 UI (방장 화면 하단)
- 배포 환경 설정 (MySQL 등 운영 DB로 교체)
