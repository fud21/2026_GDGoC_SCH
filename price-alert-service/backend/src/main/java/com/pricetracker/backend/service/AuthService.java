package com.pricetracker.backend.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pricetracker.backend.domain.User;
import com.pricetracker.backend.dto.AuthResponse;
import com.pricetracker.backend.dto.LoginRequest;
import com.pricetracker.backend.dto.SignupRequest;
import com.pricetracker.backend.dto.UserResponse;
import com.pricetracker.backend.exception.DuplicateResourceException;
import com.pricetracker.backend.exception.InvalidCredentialsException;
import com.pricetracker.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/** 인증 관련 비즈니스 로직. */
@Service
@RequiredArgsConstructor
public class AuthService {

	private final UserRepository userRepository;
	private final AuthTokenService authTokenService;
	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	/** 회원가입 */
	@Transactional
	public AuthResponse signup(SignupRequest request) {
		if (userRepository.existsByUserId(request.userId())) {
			throw new DuplicateResourceException("이미 사용 중인 아이디입니다.");
		}
		if (userRepository.existsByEmail(request.email())) {
			throw new DuplicateResourceException("이미 사용 중인 이메일입니다.");
		}

		User user = new User(
			request.userId(),
			request.email(),
			passwordEncoder.encode(request.password())
		);
		userRepository.save(user);

		return toAuthResponse(user);
	}

	/** 로그인 */
	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		User user = userRepository.findByUserId(request.userId())
			.orElseThrow(() -> new InvalidCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다."));

		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new InvalidCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다.");
		}

		return toAuthResponse(user);
	}

	/** 로그아웃 */
	public void logout() {
		// 현재 토큰은 서버에 저장하지 않으므로, 클라이언트 세션 삭제로 로그아웃을 완료한다.
	}

	private AuthResponse toAuthResponse(User user) {
		return AuthResponse.bearer(
			authTokenService.createToken(user),
			UserResponse.from(user)
		);
	}
}
