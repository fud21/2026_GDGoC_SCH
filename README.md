# StudyMate (스터디메이트)

순천향대학교(SCH) 학생들을 위한 스터디 모집 웹 애플리케이션입니다.

## 기술 스택

| 영역 | 스택 |
|---|---|
| 백엔드 | Spring Boot, Java 17, H2 Database, Spring Security, Firebase Admin SDK, Spring Mail |
| 프론트엔드 | React, Tailwind CSS, Axios, Firebase SDK |
| 인증 | Firebase Authentication (`@sch.ac.kr` 이메일 전용) |

---

## 주요 기능

### 인증
- `@sch.ac.kr` 이메일만 회원가입/로그인 가능, 가입 시 이메일 인증 필수
- 새로고침 시 로그인 상태 유지, 무활동 시 자동 로그아웃

### 스터디
- 생성: 제목, 카테고리, 대표이미지, 소개, 참여조건, 진행방식, 일정/시간, 장소, 모집인원, 태그
- 검색/카테고리 필터(전체·전공·어학·자격증·취업·기타), 찜하기
- 참여 신청 → 방장 승인/거절, 강제 내보내기
- 인기 카테고리: 실제 등록 수 기준 표시

### 마이페이지
- 프로필 수정(이름, 학과, 학년, 사진)
- 내가 만든 스터디 / 참여 중인 스터디 / 찜 목록 전용 조회 페이지
- 설정 페이지: 로그아웃 / 회원탈퇴

### 알림
- 참여 신청 시 방장에게, 승인 시 신청자에게 자동 알림
- 문의 접수/답변 완료 시 자동 알림
- 알림 읽음 처리, 전체 읽음 처리

### 문의하기
- 제목/내용 작성 시 관리자 이메일(Gmail SMTP)로 자동 발송
- 관리자 전용 문의 관리 페이지에서 답변 작성 → 문의자에게 답변 완료 알림

### UI/UX
- 하단 고정 네비게이션 바(홈/검색/만들기/마이), 브라우저 뒤로가기(popstate) 대응

---

## 프로젝트 구조

```
studymate/               ← Spring Boot 백엔드
  src/main/java/com/studymate/studymate/
    config/              # Security, Firebase 설정
    controller/          # Auth, User, Study, Notification, Inquiry
    entity/              # User, Study, Notification, Inquiry
    repository/
    service/             # MailService (문의 이메일 발송)
    dto/

frontend/                ← React 프론트엔드
  src/
    api/studyApi.js      # 모든 axios 호출 모음
    hooks/               # useAuth, useStudy, useNotification
    pages/               # 화면별 컴포넌트
    components/          # NavBar, StudyCard, EditProfileModal
    App.js               # 라우팅(currentPage) + 훅 조합
```

---

## 실행 방법

### 사전 준비
1. Firebase 서비스 계정 키를 `config/firebase/serviceAccount.json`에 저장 (Git 제외)
2. `frontend/src/firebase.js`의 `firebaseConfig`를 본인 Firebase 프로젝트 값으로 설정
3. (선택) 문의하기 이메일 발송을 쓰려면 `studymate/src/main/resources/application-local.properties`에 아래 값 설정 (Git 제외)
   ```properties
   spring.mail.username=발신용Gmail주소
   spring.mail.password=Gmail앱비밀번호
   ```

### 백엔드
```bash
cd studymate
./gradlew bootRun
# http://localhost:8080
```

### 프론트엔드
```bash
cd frontend
npm install
npm start
# http://localhost:3000
```

### H2 콘솔
- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/studymatedb`
- User Name: `sa` / Password: (빈칸)
