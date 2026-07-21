package com.pricetracker.backend.exception;

/** 이미 존재하는 리소스를 만들려고 할 때 던지는 예외 (409 로 매핑) */
public class DuplicateResourceException extends RuntimeException {

	public DuplicateResourceException(String message) {
		super(message);
	}
}
