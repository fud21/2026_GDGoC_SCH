-- 안심집(Safety-Home) MySQL Database Schema

-- 1. 안전 시설물 정보 테이블 (CCTV, 보안등, 파출소 등)
CREATE TABLE IF NOT EXISTS safety_facilities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    facility_type VARCHAR(50) NOT NULL COMMENT '시설 유형 (CCTV, LIGHT, POLICE)',
    address VARCHAR(255) COMMENT '소재지 도로명/지번 주소',
    latitude DOUBLE NOT NULL COMMENT '위도',
    longitude DOUBLE NOT NULL COMMENT '경도',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 주소별 안전 점수 및 등급 캐싱 테이블
CREATE TABLE IF NOT EXISTS safety_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(255) NOT NULL COMMENT '검색 주소',
    cctv_count INT DEFAULT 0 COMMENT '반경 내 CCTV 수',
    light_count INT DEFAULT 0 COMMENT '반경 내 보안등 수',
    police_distance DOUBLE COMMENT '가장 가까운 파출소 거리(m)',
    crime_rate_score INT COMMENT '범죄 발생 건수 반영 점수',
    total_score INT NOT NULL COMMENT '가중치 적용 최종 점수',
    grade VARCHAR(5) NOT NULL COMMENT 'S~D 안전 등급',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 공간 좌표 검색 성능 향상을 위한 인덱스 설정
CREATE INDEX idx_facility_coords ON safety_facilities (latitude, longitude);
