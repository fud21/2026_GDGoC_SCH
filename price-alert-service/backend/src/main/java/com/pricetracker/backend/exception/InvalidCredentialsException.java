package com.pricetracker.backend.exception;

/** 로그인 정보가 올바르지 않을 때 던지는 예외 (401 로 매핑) */
public class InvalidCredentialsException extends RuntimeException {

	public InvalidCredentialsException(String message) {
		super(message);
	}
}
