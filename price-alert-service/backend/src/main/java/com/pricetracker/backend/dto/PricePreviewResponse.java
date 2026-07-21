package com.pricetracker.backend.dto;

import com.pricetracker.backend.domain.MallType;

/** URL 기준 현재가 미리 확인 응답 */
public record PricePreviewResponse(
	MallType mallType,
	Long currentPrice
) {
}
