package com.pricetracker.backend.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pricetracker.backend.dto.AlertEnabledUpdateRequest;
import com.pricetracker.backend.dto.PriceHistoryResponse;
import com.pricetracker.backend.dto.ProductCreateRequest;
import com.pricetracker.backend.dto.ProductResponse;
import com.pricetracker.backend.dto.TargetPriceUpdateRequest;
import com.pricetracker.backend.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 관심 상품 API.
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

	private final ProductService productService;

	/** 관심 상품 등록 (등록 시 최초 현재가 크롤링) */
	@PostMapping
	public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductCreateRequest request) {
		ProductResponse response = productService.createProduct(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	/** 관심 상품 전체 목록 */
	@GetMapping
	public List<ProductResponse> list() {
		return productService.getProducts();
	}

	/** 목표 가격 수정 */
	@PatchMapping("/{id}/target-price")
	public ProductResponse updateTargetPrice(
			@PathVariable Long id,
			@Valid @RequestBody TargetPriceUpdateRequest request) {
		return productService.updateTargetPrice(id, request.targetPrice());
	}

	/** 알림 활성화 여부 수정 */
	@PatchMapping("/{id}/alert-enabled")
	public ProductResponse updateAlertEnabled(
			@PathVariable Long id,
			@Valid @RequestBody AlertEnabledUpdateRequest request) {
		return productService.updateAlertEnabled(id, request.alertEnabled());
	}

	/** 관심 상품 삭제 */
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		productService.deleteProduct(id);
		return ResponseEntity.noContent().build();
	}

	/** 가격 변동 이력 (그래프용) */
	@GetMapping("/{id}/price-history")
	public List<PriceHistoryResponse> priceHistory(@PathVariable Long id) {
		return productService.getPriceHistory(id);
	}
}
