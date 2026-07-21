package com.pricetracker.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pricetracker.backend.domain.MallType;
import com.pricetracker.backend.domain.Product;
import com.pricetracker.backend.dto.PriceHistoryResponse;
import com.pricetracker.backend.dto.ProductCreateRequest;
import com.pricetracker.backend.dto.ProductResponse;
import com.pricetracker.backend.exception.ResourceNotFoundException;
import com.pricetracker.backend.repository.PriceHistoryRepository;
import com.pricetracker.backend.repository.ProductRepository;
import com.pricetracker.backend.repository.AlertRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 관심 상품 관련 비즈니스 로직.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

	// 인증 도입 전까지 사용할 임시 고정 사용자 ID
	private static final Long TEMP_USER_ID = 1L;

	private final ProductRepository productRepository;
	private final AlertRepository alertRepository;
	private final PriceHistoryRepository priceHistoryRepository;
	private final PriceCrawlingService priceCrawlingService;
	private final PriceCheckService priceCheckService;

	/** 관심 상품 등록. 등록 시점에 최초 현재가를 크롤링한다. */
	@Transactional
	public ProductResponse createProduct(ProductCreateRequest request) {
		// URL 도메인으로 몰 종류 자동 판별
		MallType mallType = MallType.fromUrl(request.url());

		// 최초 현재가 크롤링 (실패해도 등록은 진행, currentPrice 는 null)
		Optional<Long> initialPrice = priceCrawlingService.crawlPrice(request.url(), mallType);

		Product product = new Product(
			request.name(),
			request.url(),
			mallType,
			initialPrice.orElse(null),
			request.targetPrice(),
			TEMP_USER_ID
		);
		if (request.alertEnabled() != null) {
			product.setAlertEnabled(request.alertEnabled());
		}
		productRepository.save(product);

		// 크롤링 성공 시 이력 저장 + 목표가 조건 즉시 평가
		initialPrice.ifPresent(price -> priceCheckService.recordAndEvaluate(product, price));

		log.info("상품 등록 - id={}, name={}, mallType={}, currentPrice={}",
			product.getId(), product.getName(), mallType, product.getCurrentPrice());

		return ProductResponse.from(product);
	}

	/** 등록된 관심 상품 전체 목록 (최신 등록순) */
	@Transactional(readOnly = true)
	public List<ProductResponse> getProducts() {
		return productRepository.findAllByOrderByCreatedAtDesc().stream()
			.map(ProductResponse::from)
			.toList();
	}

	/** 목표 가격 수정 */
	@Transactional
	public ProductResponse updateTargetPrice(Long productId, Long targetPrice) {
		Product product = findProductOrThrow(productId);
		product.setTargetPrice(targetPrice);
		return ProductResponse.from(product);
	}

	/** 알림 활성화 여부 수정 */
	@Transactional
	public ProductResponse updateAlertEnabled(Long productId, Boolean alertEnabled) {
		Product product = findProductOrThrow(productId);
		product.setAlertEnabled(alertEnabled);
		return ProductResponse.from(product);
	}

	/** 관심 상품 삭제 */
	@Transactional
	public void deleteProduct(Long productId) {
		Product product = findProductOrThrow(productId);
		alertRepository.deleteByProductId(productId);
		priceHistoryRepository.deleteByProductId(productId);
		productRepository.delete(product);
	}

	/** 가격 변동 이력 (그래프용, checkedAt 오름차순) */
	@Transactional(readOnly = true)
	public List<PriceHistoryResponse> getPriceHistory(Long productId) {
		// 존재하지 않는 상품이면 404
		findProductOrThrow(productId);
		return priceHistoryRepository.findByProductIdOrderByCheckedAtAsc(productId).stream()
			.map(PriceHistoryResponse::from)
			.toList();
	}

	private Product findProductOrThrow(Long productId) {
		return productRepository.findById(productId)
			.orElseThrow(() -> new ResourceNotFoundException("상품을 찾을 수 없습니다. id=" + productId));
	}
}
