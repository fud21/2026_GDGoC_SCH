package com.pricetracker.backend.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.pricetracker.backend.service.PriceCheckService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 가격 재크롤링 스케줄러.
 * 30분마다 알림 활성화된 상품의 가격을 체크한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PriceCheckScheduler {

	// 30분 (밀리초)
	private static final long CHECK_INTERVAL_MS = 30 * 60 * 1000L;

	private final PriceCheckService priceCheckService;

	// 앱 시작 1분 후부터, 이후 30분 간격으로 실행
	@Scheduled(initialDelay = 60 * 1000L, fixedDelay = CHECK_INTERVAL_MS)
	public void checkPrices() {
		log.info("[스케줄러] 가격 체크 실행");
		priceCheckService.checkAllPrices();
	}
}
