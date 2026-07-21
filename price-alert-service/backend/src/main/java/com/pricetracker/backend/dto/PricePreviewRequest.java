package com.pricetracker.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** URL 기준 현재가 미리 확인 요청 */
public record PricePreviewRequest(
	@NotBlank(message = "상품 URL은 필수입니다.")
	String url
) {
}
