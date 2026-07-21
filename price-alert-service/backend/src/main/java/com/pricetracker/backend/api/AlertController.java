package com.pricetracker.backend.api;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pricetracker.backend.dto.AlertResponse;
import com.pricetracker.backend.service.AlertService;

import lombok.RequiredArgsConstructor;

/**
 * 알림 API.
 */
@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

	private final AlertService alertService;

	/** 알림 내역 조회 (최신순) */
	@GetMapping
	public List<AlertResponse> list() {
		return alertService.getAlerts();
	}

	/** 알림 읽음 처리 */
	@PatchMapping("/{id}/read")
	public AlertResponse markAsRead(@PathVariable Long id) {
		return alertService.markAsRead(id);
	}
}
