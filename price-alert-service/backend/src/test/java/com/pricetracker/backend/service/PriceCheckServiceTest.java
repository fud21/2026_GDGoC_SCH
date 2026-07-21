package com.pricetracker.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.pricetracker.backend.domain.MallType;
import com.pricetracker.backend.domain.Product;
import com.pricetracker.backend.repository.AlertRepository;
import com.pricetracker.backend.repository.ProductRepository;

@SpringBootTest
class PriceCheckServiceTest {

	@Autowired
	private PriceCheckService priceCheckService;

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	private AlertRepository alertRepository;

	@Test
	void createsAlertWhenPriceDropsBelowTarget() {
		Product product = productRepository.save(new Product(
			"테스트 상품",
			"https://www.coupang.com/products/test",
			MallType.COUPANG,
			12_000L,
			10_000L,
			1L
		));

		boolean alertCreated = priceCheckService.recordAndEvaluate(product, 9_000L);

		assertThat(alertCreated).isTrue();
		assertThat(alertRepository.findAllByOrderByCreatedAtDesc())
			.anySatisfy(alert -> {
				assertThat(alert.getProduct().getId()).isEqualTo(product.getId());
				assertThat(alert.getTriggeredPrice()).isEqualTo(9_000L);
				assertThat(alert.getTargetPrice()).isEqualTo(10_000L);
			});
	}

	@Test
	void createsAlertWhenRegisteredPriceIsAlreadyBelowTarget() {
		Product product = productRepository.save(new Product(
			"테스트 상품",
			"https://www.coupang.com/products/test",
			MallType.COUPANG,
			9_000L,
			10_000L,
			1L
		));

		boolean alertCreated = priceCheckService.recordAndEvaluate(product, 9_000L);

		assertThat(alertCreated).isTrue();
		assertThat(alertRepository.findAllByOrderByCreatedAtDesc())
			.anySatisfy(alert -> {
				assertThat(alert.getProduct().getId()).isEqualTo(product.getId());
				assertThat(alert.getTriggeredPrice()).isEqualTo(9_000L);
				assertThat(alert.getTargetPrice()).isEqualTo(10_000L);
			});
	}
}
