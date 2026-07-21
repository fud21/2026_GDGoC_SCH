package com.pricetracker.backend.api;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pricetracker.backend.domain.MallType;
import com.pricetracker.backend.dto.PricePreviewRequest;
import com.pricetracker.backend.dto.PricePreviewResponse;
import com.pricetracker.backend.service.PriceCrawlingService;
import com.pricetracker.backend.service.PriceCheckService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 가격 체크 수동 실행 API.
 * 스케줄러(30분 간격)를 기다리지 않고 즉시 가격 체크를 돌려볼 수 있게 하는 개발/테스트용 엔드포인트.
 */
@RestController
@RequestMapping("/api/price-check")
@RequiredArgsConstructor
public class PriceCheckController {

	private final PriceCheckService priceCheckService;
	private final PriceCrawlingService priceCrawlingService;

	/** 알림 활성화된 모든 상품의 가격을 즉시 재체크한다. */
	@PostMapping
	public String runNow() {
		priceCheckService.checkAllPrices();
		return "price check executed";
	}

	/** 등록 전 URL 기준으로 현재가를 즉시 확인한다. */
	@PostMapping("/preview")
	public PricePreviewResponse preview(@Valid @RequestBody PricePreviewRequest request) {
		MallType mallType = MallType.fromUrl(request.url());
		Long currentPrice = priceCrawlingService.crawlPrice(request.url(), mallType)
			.orElseThrow(() -> new ResponseStatusException(
				HttpStatus.BAD_REQUEST,
				"현재 최저가를 확인하지 못했습니다. 지원 쇼핑몰 URL인지 확인해주세요."
			));

		return new PricePreviewResponse(mallType, currentPrice);
	}
}
