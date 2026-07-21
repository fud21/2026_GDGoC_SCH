package com.pricetracker.backend.dto;

import java.time.LocalDateTime;

import com.pricetracker.backend.domain.Alert;

/** 가격 하락 알림 응답 */
public record AlertResponse(
	Long id,
	Long productId,
	String productName,
	Long triggeredPrice,
	Long targetPrice,
	boolean isRead,
	LocalDateTime createdAt
) {
	public static AlertResponse from(Alert alert) {
		return new AlertResponse(
			alert.getId(),
			alert.getProduct().getId(),
			alert.getProduct().getName(),
			alert.getTriggeredPrice(),
			alert.getTargetPrice(),
			alert.isRead(),
			alert.getCreatedAt()
		);
	}
}
