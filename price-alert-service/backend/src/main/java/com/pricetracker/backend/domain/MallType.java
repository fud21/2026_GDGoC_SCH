package com.pricetracker.backend.domain;

import java.util.List;

/**
 * 쇼핑몰 종류.
 * - 도메인 키워드로 URL에서 자동 판별한다.
 * - 몰별 가격 CSS 셀렉터를 하드코딩하지 않고 이 Enum에 분리해 둔다.
 *   (여러 후보 셀렉터를 두어 페이지 구조가 조금 달라도 대응)
 */
public enum MallType {

	COUPANG("coupang.com", List.of(
		"span.total-price > strong",
		"span.total-price strong",
		".prod-price .total-price")),

	NAVER("naver.com", List.of(
		"span.price em .num",
		".lowestPrice_num__A5gM9",
		"._1LY7DqCnwR")),

	ELEVENST("11st.co.kr", List.of(
		".price_area .value",
		"dd.price strong")),

	GMARKET("gmarket.co.kr", List.of(
		"span.price_real",
		".item_price strong")),

	// 판별 불가한 몰. 크롤링 시 스킵 처리한다.
	UNKNOWN("", List.of());

	private final String domainKeyword;
	private final List<String> priceSelectors;

	MallType(String domainKeyword, List<String> priceSelectors) {
		this.domainKeyword = domainKeyword;
		this.priceSelectors = priceSelectors;
	}

	public List<String> getPriceSelectors() {
		return priceSelectors;
	}

	/** URL 도메인으로 몰 종류를 자동 판별한다. */
	public static MallType fromUrl(String url) {
		if (url == null || url.isBlank()) {
			return UNKNOWN;
		}
		String lower = url.toLowerCase();
		for (MallType type : values()) {
			if (type != UNKNOWN && lower.contains(type.domainKeyword)) {
				return type;
			}
		}
		return UNKNOWN;
	}
}
