package com.pricetracker.backend.dto;

import java.time.LocalDateTime;

import com.pricetracker.backend.domain.PriceHistory;

/** 가격 변동 이력 응답 (그래프용) */
public record PriceHistoryResponse(
	Long price,
	LocalDateTime checkedAt
) {
	public static PriceHistoryResponse from(PriceHistory history) {
		return new PriceHistoryResponse(history.getPrice(), history.getCheckedAt());
	}
}
