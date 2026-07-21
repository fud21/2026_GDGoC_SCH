package com.pricetracker.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pricetracker.backend.domain.Alert;
import com.pricetracker.backend.domain.PriceHistory;
import com.pricetracker.backend.domain.Product;
import com.pricetracker.backend.repository.AlertRepository;
import com.pricetracker.backend.repository.PriceHistoryRepository;
import com.pricetracker.backend.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 가격 체크 핵심 로직.
 * - 크롤링된 가격을 이력에 저장하고 현재가를 갱신한다.
 * - 현재가가 목표가 이하이면 알림(Alert)을 생성한다.
 * 등록 시점과 스케줄러 양쪽에서 재사용한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PriceCheckService {

	private final ProductRepository productRepository;
	private final PriceHistoryRepository priceHistoryRepository;
	private final AlertRepository alertRepository;
	private final PriceCrawlingService priceCrawlingService;

	/**
	 * 크롤링된 가격 한 건을 기록하고 알림 조건을 평가한다.
	 * @return 알림이 생성되었으면 true
	 */
	@Transactional
	public boolean recordAndEvaluate(Product product, Long price) {
		// 1) 가격 이력 저장
		priceHistoryRepository.save(new PriceHistory(product, price));

		// 2) 현재가 갱신
		product.setCurrentPrice(price);

		// 3) 현재가가 목표가 이하이면 알림 조건 평가
		return evaluateTargetReached(product, price);
	}

	/**
	 * 현재가가 목표가 이하이면 알림 조건을 평가한다.
	 */
	@Transactional
	public boolean evaluateTargetReached(Product product, Long currentPrice) {
		if (currentPrice == null || product.getTargetPrice() == null || !product.isAlertEnabled()) {
			return false;
		}

		if (currentPrice <= product.getTargetPrice()
				&& !alertRepository.existsByProductIdAndIsReadFalse(product.getId())) {
			alertRepository.save(new Alert(product, currentPrice, product.getTargetPrice()));
			log.info("알림 생성 - productId={}, price={}, targetPrice={}",
				product.getId(), currentPrice, product.getTargetPrice());
			return true;
		}
		return false;
	}

	/**
	 * 알림 활성화된 모든 상품을 순회하며 가격을 재크롤링하고 조건을 평가한다.
	 * 개별 상품 크롤링 실패는 로그만 남기고 스킵한다(전체 중단 방지).
	 */
	@Transactional
	public void checkAllPrices() {
		List<Product> products = productRepository.findByAlertEnabledTrue();
		log.info("가격 체크 시작 - 대상 상품 {}건", products.size());

		int success = 0;
		for (Product product : products) {
			Optional<Long> price = priceCrawlingService.crawlPrice(product.getUrl(), product.getMallType());
			if (price.isEmpty()) {
				// 크롤링 실패 상품은 스킵
				continue;
			}
			recordAndEvaluate(product, price.get());
			success++;
		}

		log.info("가격 체크 완료 - 성공 {}건 / 전체 {}건", success, products.size());
	}
}
