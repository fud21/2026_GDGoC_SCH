package com.pricetracker.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pricetracker.backend.domain.Alert;

public interface AlertRepository extends JpaRepository<Alert, Long> {

	// 알림 내역을 최신순으로 조회
	List<Alert> findAllByOrderByCreatedAtDesc();

	// 중복 알림 방지: 해당 상품에 아직 읽지 않은 알림이 있는지 확인
	boolean existsByProductIdAndIsReadFalse(Long productId);

	// 상품 삭제 전 연관 알림 삭제
	void deleteByProductId(Long productId);
}
