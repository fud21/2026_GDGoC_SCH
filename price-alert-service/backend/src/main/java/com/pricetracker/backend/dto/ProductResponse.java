package com.pricetracker.backend.dto;

import java.time.LocalDateTime;

import com.pricetracker.backend.domain.MallType;
import com.pricetracker.backend.domain.Product;

/** 관심 상품 응답 */
public record ProductResponse(
	Long id,
	String name,
	String url,
	MallType mallType,
	Long currentPrice,
	Long targetPrice,
	boolean alertEnabled,
	LocalDateTime createdAt
) {
	public static ProductResponse from(Product product) {
		return new ProductResponse(
			product.getId(),
			product.getName(),
			product.getUrl(),
			product.getMallType(),
			product.getCurrentPrice(),
			product.getTargetPrice(),
			product.isAlertEnabled(),
			product.getCreatedAt()
		);
	}
}
