package com.pricetracker.backend.dto;

import jakarta.validation.constraints.NotNull;

/** 관심 상품 알림 활성화 여부 수정 요청 */
public record AlertEnabledUpdateRequest(
	@NotNull(message = "알림 활성화 여부는 필수입니다.")
	Boolean alertEnabled
) {
}
