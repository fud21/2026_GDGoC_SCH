package com.pricetracker.backend.service;

import java.util.Optional;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import com.pricetracker.backend.config.CrawlingProperties;
import com.pricetracker.backend.domain.MallType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상품 페이지에서 가격을 크롤링하는 서비스.
 * - 몰별 CSS 셀렉터는 MallType Enum 에서 가져온다.
 * - 실패 시 예외를 던지지 않고 Optional.empty() 를 반환한다.
 *   (스케줄러 전체가 죽지 않도록 방어적으로 처리)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PriceCrawlingService {

	private final CrawlingProperties crawlingProperties;

	/**
	 * 주어진 URL 에서 가격을 크롤링한다.
	 * @return 크롤링 성공 시 가격(원), 실패 시 Optional.empty()
	 */
	public Optional<Long> crawlPrice(String url, MallType mallType) {
		if (mallType == null || mallType == MallType.UNKNOWN
				|| mallType.getPriceSelectors().isEmpty()) {
			log.warn("크롤링 스킵 - 지원하지 않는 몰입니다. url={}", url);
			return Optional.empty();
		}

		try {
			// User-Agent, timeout 을 반드시 포함해 요청
			Document doc = Jsoup.connect(url)
				.userAgent(crawlingProperties.getUserAgent())
				.timeout(crawlingProperties.getTimeoutMs())
				.get();

			// 후보 셀렉터를 순서대로 시도해 가장 먼저 매칭되는 값을 사용
			for (String selector : mallType.getPriceSelectors()) {
				Element element = doc.selectFirst(selector);
				if (element == null) {
					continue;
				}
				Optional<Long> price = parsePrice(element.text());
				if (price.isPresent()) {
					log.info("크롤링 성공 - url={}, selector={}, price={}", url, selector, price.get());
					return price;
				}
			}

			log.warn("크롤링 실패 - 가격 요소를 찾지 못했습니다. url={}", url);
			return Optional.empty();

		} catch (Exception e) {
			// 네트워크 오류, timeout, 차단 등 모든 예외를 여기서 흡수한다.
			log.warn("크롤링 실패 - url={}, reason={}", url, e.getMessage());
			return Optional.empty();
		}
	}

	/** "1,234,000원" 같은 텍스트에서 숫자만 뽑아 가격으로 변환한다. */
	private Optional<Long> parsePrice(String text) {
		if (text == null) {
			return Optional.empty();
		}
		String digits = text.replaceAll("[^0-9]", "");
		if (digits.isEmpty()) {
			return Optional.empty();
		}
		try {
			return Optional.of(Long.parseLong(digits));
		} catch (NumberFormatException e) {
			return Optional.empty();
		}
	}
}
