# MySQL 및 Spring Boot 연결 가이드

이 문서는 로컬 PC에서 MySQL을 설치하고, 이 Spring Boot 프로젝트와 연결하는 방법을 정리합니다.

## 권장 MySQL 버전

팀 공통 기준으로는 **MySQL 8.4 LTS**를 권장합니다.

현재 작성자 로컬 PC에서는 아래 버전으로 동작을 확인했습니다.

```text
mysql  Ver 9.6.0 for macos26.3 on arm64 (Homebrew)
```

MySQL 9.x에서도 동작하지만, 팀원 간 환경을 맞추기에는 LTS 버전인 MySQL 8.4가 더 안정적인 기준입니다.

## 자동 생성되는 것과 직접 해야 하는 것

Spring Boot를 실행한다고 해서 MySQL의 모든 준비가 자동으로 끝나지는 않습니다.

직접 해야 하는 것:

```text
MySQL 설치
MySQL 서버 실행
stockmanager DB 생성
stockuser 계정 생성
stockuser 계정에 DB 권한 부여
```

Spring Boot가 자동으로 해주는 것:

```text
users 테이블 생성
Entity 기준 컬럼 생성 및 갱신
```

자동 테이블 생성은 아래 설정 때문에 동작합니다.

```properties
spring.jpa.hibernate.ddl-auto=update
```

즉 팀원들이 처음 실행할 때는 반드시 **DB와 계정은 직접 만들고**, 그 다음 Spring Boot를 실행해야 합니다. DB와 계정만 준비되어 있으면 `users` 테이블은 `AppUser` Entity 기준으로 자동 생성됩니다.

## macOS에서 MySQL 설치

팀 권장 버전:

```bash
brew install mysql@8.4
brew services start mysql@8.4
```

Homebrew 최신 MySQL을 사용할 경우:

```bash
brew install mysql
brew services start mysql
```

MySQL 실행 상태와 버전을 확인합니다.

```bash
brew services list
mysql --version
```

## DB와 계정 생성

root 계정으로 접속합니다.

```bash
mysql -u root
```

프로젝트에서 사용할 DB와 계정을 생성합니다.

```sql
CREATE DATABASE stockmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stockuser'@'localhost' IDENTIFIED BY 'stockpass';
GRANT ALL PRIVILEGES ON stockmanager.* TO 'stockuser'@'localhost';
FLUSH PRIVILEGES;
```

접속 테스트:

```bash
mysql -u stockuser -pstockpass stockmanager
```

접속에 성공하면 MySQL 준비는 끝난 것입니다.

## 환경변수 설정

이 프로젝트는 아래 환경변수를 읽습니다.

```text
DB_URL
DB_USERNAME
DB_PASSWORD
```

예시는 프로젝트 루트의 [.env.example](../.env.example)에 있습니다.

주의할 점:

```text
Spring Boot는 .env 파일을 자동으로 읽지 않습니다.
```

따라서 `.env` 파일은 참고용으로만 사용하고, 실제 실행 시에는 IntelliJ 실행 설정 또는 터미널 환경변수로 값을 넣어야 합니다.

### IntelliJ에서 설정하는 방법

`StockManagerApplication` 실행 설정을 열고 Environment variables에 아래 값을 넣습니다.

```text
DB_URL=jdbc:mysql://localhost:3306/stockmanager?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
DB_USERNAME=stockuser
DB_PASSWORD=stockpass
```

환경변수를 따로 넣지 않아도 `application.properties`에 기본값이 있으므로 로컬 기본 설정에서는 바로 실행할 수 있습니다.

### 터미널에서 설정하는 방법

```bash
export DB_URL='jdbc:mysql://localhost:3306/stockmanager?serverTimezone=Asia/Seoul&characterEncoding=UTF-8'
export DB_USERNAME='stockuser'
export DB_PASSWORD='stockpass'
./gradlew bootRun
```

## Spring Boot DB 연결 설정

DB 연결 설정 파일:

```text
src/main/resources/application.properties
```

현재 설정:

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/stockmanager?serverTimezone=Asia/Seoul&characterEncoding=UTF-8}
spring.datasource.username=${DB_USERNAME:stockuser}
spring.datasource.password=${DB_PASSWORD:stockpass}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

`${환경변수:기본값}` 형식입니다.

예를 들어:

```properties
spring.datasource.username=${DB_USERNAME:stockuser}
```

뜻은 다음과 같습니다.

```text
DB_USERNAME 환경변수가 있으면 그 값을 사용
없으면 stockuser 사용
```

## Entity 기반 테이블 자동 갱신

현재 JPA 설정:

```properties
spring.jpa.hibernate.ddl-auto=update
```

이 설정은 Spring Boot 실행 시 Hibernate가 Entity를 확인하고 DB 테이블을 자동으로 생성하거나 갱신하게 합니다.

현재 사용자 테이블은 아래 Entity 기준으로 생성됩니다.

```text
src/main/java/com/gdg/stockmanager/domain/AppUser.java
```

생성되는 테이블:

```text
users
```

주요 컬럼:

```text
id
username
password
role
```

## 실행 방법

MySQL 서버가 실행 중이고, DB와 계정이 만들어져 있어야 합니다.

```bash
./gradlew bootRun
```

브라우저에서 접속합니다.

```text
http://localhost:8080/
```

## 자주 발생하는 문제

### Unknown database 'stockmanager'

`stockmanager` DB가 아직 생성되지 않은 상태입니다.

```sql
CREATE DATABASE stockmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Access denied for user

DB 계정 또는 비밀번호가 잘못되었거나 권한이 없습니다.

```bash
mysql -u stockuser -pstockpass stockmanager
```

위 명령으로 직접 접속이 되는지 먼저 확인합니다.

### Communications link failure

MySQL 서버가 실행 중이 아니거나 포트가 다를 수 있습니다.

```bash
brew services list
brew services start mysql
```

### users 테이블이 없음

DB와 계정이 정상이고 Spring Boot가 한 번 이상 정상 실행되면 `users` 테이블은 자동 생성됩니다.

확인할 설정:

```properties
spring.jpa.hibernate.ddl-auto=update
```

테이블 확인:

```bash
mysql -u stockuser -pstockpass -e "SHOW TABLES;" stockmanager
```
