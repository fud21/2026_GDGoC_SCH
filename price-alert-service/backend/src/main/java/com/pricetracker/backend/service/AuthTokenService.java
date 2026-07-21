package com.pricetracker.backend.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.pricetracker.backend.domain.User;

/** 의존성 없이 쓰는 간단한 서명 토큰 발급기. */
@Service
public class AuthTokenService {

	private final String secret;
	private final long expirationSeconds;

	public AuthTokenService(
			@Value("${app.auth.token-secret:change-this-dev-secret}") String secret,
			@Value("${app.auth.token-expiration-seconds:86400}") long expirationSeconds) {
		this.secret = secret;
		this.expirationSeconds = expirationSeconds;
	}

	public String createToken(User user) {
		long expiresAt = Instant.now().plusSeconds(expirationSeconds).getEpochSecond();
		String payload = user.getId() + ":" + user.getUserId() + ":" + expiresAt;
		String encodedPayload = base64Url(payload.getBytes(StandardCharsets.UTF_8));
		String signature = sign(encodedPayload);

		return encodedPayload + "." + signature;
	}

	private String sign(String payload) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
			return base64Url(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
		} catch (Exception e) {
			throw new IllegalStateException("토큰 생성에 실패했습니다.", e);
		}
	}

	private String base64Url(byte[] bytes) {
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}
}
