package com.pricetracker.backend.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 관심 상품.
 * 사용자가 등록한 추적 대상 상품과 목표 가격을 담는다.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String name;

	@Column(length = 1000)
	private String url;

	// 몰 종류 (URL 도메인으로 자동 판별)
	@Enumerated(EnumType.STRING)
	private MallType mallType;

	// 최근 크롤링된 현재가. 크롤링 실패 시 null 일 수 있다.
	private Long currentPrice;

	// 사용자가 설정한 목표 가격
	private Long targetPrice;

	// 알림(가격 체크) 활성화 여부
	private boolean alertEnabled = true;

	// 인증 도입 전까지 임시 고정 사용자 ID
	private Long userId;

	private LocalDateTime createdAt;

	public Product(String name, String url, MallType mallType, Long currentPrice,
			Long targetPrice, Long userId) {
		this.name = name;
		this.url = url;
		this.mallType = mallType;
		this.currentPrice = currentPrice;
		this.targetPrice = targetPrice;
		this.userId = userId;
		this.alertEnabled = true;
	}

	// 저장 직전 생성 시각 자동 세팅
	@jakarta.persistence.PrePersist
	void onCreate() {
		this.createdAt = LocalDateTime.now();
	}
}
