package com.pricetracker.backend.exception;

/** 요청한 리소스를 찾지 못했을 때 던지는 예외 (404 로 매핑) */
public class ResourceNotFoundException extends RuntimeException {

	public ResourceNotFoundException(String message) {
		super(message);
	}
}
