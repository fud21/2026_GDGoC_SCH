package com.pricetracker.backend.dto;

/** 로그인/회원가입 응답 */
public record AuthResponse(
	String accessToken,
	String tokenType,
	UserResponse user
) {
	public static AuthResponse bearer(String accessToken, UserResponse user) {
		return new AuthResponse(accessToken, "Bearer", user);
	}
}
