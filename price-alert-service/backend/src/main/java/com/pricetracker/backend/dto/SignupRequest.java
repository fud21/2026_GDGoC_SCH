package com.pricetracker.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 회원가입 요청 */
public record SignupRequest(

	@NotBlank(message = "아이디는 필수입니다.")
	@Size(min = 4, max = 50, message = "아이디는 4자 이상 50자 이하여야 합니다.")
	String userId,

	@NotBlank(message = "비밀번호는 필수입니다.")
	@Size(min = 8, max = 100, message = "비밀번호는 8자 이상 100자 이하여야 합니다.")
	String password,

	@NotBlank(message = "이메일은 필수입니다.")
	@Email(message = "올바른 이메일 형식이 아닙니다.")
	String email
) {
}
