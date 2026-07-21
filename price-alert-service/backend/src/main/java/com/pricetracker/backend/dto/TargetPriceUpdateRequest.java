package com.pricetracker.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** 목표 가격 수정 요청 */
public record TargetPriceUpdateRequest(

	@NotNull(message = "목표 가격은 필수입니다.")
	@Positive(message = "목표 가격은 0보다 커야 합니다.")
	Long targetPrice
) {
}
