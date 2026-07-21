package com.pricetracker.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** 관심 상품 등록 요청 */
public record ProductCreateRequest(

	@NotBlank(message = "상품명은 필수입니다.")
	String name,

	@NotBlank(message = "상품 URL은 필수입니다.")
	String url,

	@NotNull(message = "목표 가격은 필수입니다.")
	@Positive(message = "목표 가격은 0보다 커야 합니다.")
	Long targetPrice,

	Boolean alertEnabled
) {
}
