package com.pricetracker.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pricetracker.backend.domain.PriceHistory;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {

	// 특정 상품의 가격 이력을 시간 오름차순으로 조회 (그래프용)
	List<PriceHistory> findByProductIdOrderByCheckedAtAsc(Long productId);

	// 상품 삭제 전 연관 가격 이력 삭제
	void deleteByProductId(Long productId);
}
