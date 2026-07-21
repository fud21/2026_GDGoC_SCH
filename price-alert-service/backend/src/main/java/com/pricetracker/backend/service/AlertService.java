package com.pricetracker.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pricetracker.backend.domain.Alert;
import com.pricetracker.backend.dto.AlertResponse;
import com.pricetracker.backend.exception.ResourceNotFoundException;
import com.pricetracker.backend.repository.AlertRepository;

import lombok.RequiredArgsConstructor;

/**
 * 알림 관련 비즈니스 로직.
 */
@Service
@RequiredArgsConstructor
public class AlertService {

	private final AlertRepository alertRepository;

	/** 알림 내역 조회 (최신순) */
	@Transactional(readOnly = true)
	public List<AlertResponse> getAlerts() {
		return alertRepository.findAllByOrderByCreatedAtDesc().stream()
			.map(AlertResponse::from)
			.toList();
	}

	/** 알림 읽음 처리 */
	@Transactional
	public AlertResponse markAsRead(Long alertId) {
		Alert alert = alertRepository.findById(alertId)
			.orElseThrow(() -> new ResourceNotFoundException("알림을 찾을 수 없습니다. id=" + alertId));
		alert.markAsRead();
		return AlertResponse.from(alert);
	}
}
