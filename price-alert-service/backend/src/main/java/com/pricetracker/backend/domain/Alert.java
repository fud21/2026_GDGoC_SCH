package com.pricetracker.backend.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 가격 하락 알림.
 * 현재가가 목표가 이하로 떨어졌을 때 생성된다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Alert {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id")
	private Product product;

	// 알림 발생 시점의 실제 가격
	private Long triggeredPrice;

	// 알림 발생 시점의 목표 가격
	private Long targetPrice;

	// 읽음 여부
	private boolean isRead = false;

	private LocalDateTime createdAt;

	public Alert(Product product, Long triggeredPrice, Long targetPrice) {
		this.product = product;
		this.triggeredPrice = triggeredPrice;
		this.targetPrice = targetPrice;
		this.isRead = false;
		this.createdAt = LocalDateTime.now();
	}

	/** 읽음 처리 */
	public void markAsRead() {
		this.isRead = true;
	}
}
