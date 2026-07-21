package com.pricetracker.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/**
 * 크롤링 관련 설정 값 (application.yml 의 app.crawling.*).
 * User-Agent, timeout 을 코드에 하드코딩하지 않고 외부 설정으로 분리한다.
 */
@Component
@ConfigurationProperties(prefix = "app.crawling")
@Getter
@Setter
public class CrawlingProperties {

	// 크롤링 요청에 사용할 User-Agent
	private String userAgent = "Mozilla/5.0";

	// 연결/읽기 timeout (ms)
	private int timeoutMs = 5000;
}
