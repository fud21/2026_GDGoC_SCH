package com.pricetracker.backend.dto;

import java.time.LocalDateTime;

import com.pricetracker.backend.domain.User;

/** 사용자 응답 */
public record UserResponse(
	Long id,
	String userId,
	String email,
	LocalDateTime createdAt
) {
	public static UserResponse from(User user) {
		return new UserResponse(
			user.getId(),
			user.getUserId(),
			user.getEmail(),
			user.getCreatedAt()
		);
	}
}
