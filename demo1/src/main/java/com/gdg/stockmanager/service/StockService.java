package com.gdg.stockmanager.service;

import com.gdg.stockmanager.dto.ChartDataDto;
import com.gdg.stockmanager.dto.YahooFinanceResponse;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import com.gdg.stockmanager.domain.AppUser;
import com.gdg.stockmanager.domain.WatchlistItem;
import com.gdg.stockmanager.repository.AppUserRepository;
import com.gdg.stockmanager.repository.WatchlistRepository;
import org.springframework.security.core.context.SecurityContextHolder;

// 1일 단위 1개월치 종가 데이터 API요청 후 DTO 변환 및 반환
@Service
public class StockService {

    // API 호출용 참조변수
    private final RestTemplate restTemplate;
    private final WatchlistRepository watchlistRepository;
    private final AppUserRepository appUserRepository;

    // 생성자 : 야후 전용 RestTemplate 빈을 할당
    public StockService(
            @Qualifier("yahooRestTemplate") RestTemplate restTemplate,
            WatchlistRepository watchlistRepository,
            AppUserRepository appUserRepository
    ) {
        this.restTemplate = restTemplate;
        this.watchlistRepository = watchlistRepository;
        this.appUserRepository = appUserRepository;
    }

    // 특정 주식 종목의 1개우러간 일별 종가 데이터(날짜, 종가) 가져오는 메소드
    public List<ChartDataDto> getStockChart(String symbol) {

        List<ChartDataDto> resultList = new ArrayList<>();

        // 입력이 공백이거나 종목이 없으면 빈 리스트 반환
        if (symbol == null || symbol.isBlank()) {
            return resultList;
        }

        // 종목 코드 공백 제거 및 대문자 통일
        symbol = symbol.trim().toUpperCase();

        // API URL (interval=1d, range=3mo)
        String url =
                "https://query1.finance.yahoo.com/v8/finance/chart/"
                        + symbol
                        + "?interval=1d&range=3mo";

        // HTTP 요청 헤더 (봇 차단 우회 설정)
        HttpHeaders headers = new HttpHeaders();
        headers.set(
                "User-Agent",
                "Mozilla/5.0"
        );

        // HTTP 엔티티
        HttpEntity<String> entity =
                new HttpEntity<>(headers);

        try {
            // API 서버에 GET 요청 및 응답 데이터 매핑
            ResponseEntity<YahooFinanceResponse> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            entity,
                            YahooFinanceResponse.class
                    );

            // API 응답 본문 추출
            YahooFinanceResponse body = response.getBody();

            // API 응답 데이터 유효 검사
            if (body == null ||
                    body.getChart() == null ||
                    body.getChart().getResult() == null ||
                    body.getChart().getResult().isEmpty()) {
                return resultList;
            }

            // 첫 번째 차트 결과 데이터 추출
            YahooFinanceResponse.YahooChartResult result =
                    body.getChart().getResult().get(0);

            // 주가 지표 데이터 유효 검사
            if (result.getIndicators() == null ||
                    result.getIndicators().getQuote() == null ||
                    result.getIndicators().getQuote().isEmpty()) {
                return resultList;
            }

            // 타임스탬프 리스트 & 당일 종가 데이터 추출
            List<Long> timestamps = result.getTimestamp();
            List<Double> closePrices =
                    result.getIndicators()
                            .getQuote()
                            .get(0)
                            .getClose();

            // 타임스탬프와 당일 종가 데이터 유효 검사
            if (timestamps == null || closePrices == null) {
                return resultList;
            }

            // 인텍스 세그폴트 방지용 리스트 사이즈 설정
            int size = Math.min(
                    timestamps.size(),
                    closePrices.size()
            );

            // 데이터틀 차트용 DTO 객체로 변환
            for (int i = 0; i < size; i++) {

                Long timestamp = timestamps.get(i);
                Double closePrice = closePrices.get(i);

                // 누락된 날짜 및 종가 데이터 무시
                if (timestamp == null || closePrice == null) {
                    continue;
                }

                // 시스템 기본 기산대 기준 (yyyy-MM-dd)로 변환
                LocalDate date =
                        Instant.ofEpochSecond(timestamp)
                                .atZone(ZoneId.systemDefault())
                                .toLocalDate();

                // 변환된 날짜 문자열과 종가 DTO에 담아 결과 리스트에 추가
                resultList.add(
                        new ChartDataDto(
                                date.toString(),
                                closePrice
                        )
                );
            }

        } catch (RestClientException e) {
            // API 통신 에러 로그 출력
            System.out.println(
                    "Yahoo Finance API 요청 실패 : "
                            + e.getMessage()
            );
        }

        // 정제된 차트 데이터 DTO 리스트 반환
        return resultList;
    }
    // 현재 로그인한 유저 가져오기 (내부용)
    private AppUser getCurrentUser() {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return appUserRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));
    }

    // API 1: 주식 검색 (Yahoo Finance 자동완성 API)
    public String searchStock(String query) {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = "https://query1.finance.yahoo.com/v1/finance/search?q="
                + encoded + "&lang=en-US&region=US&quotesCount=6";

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);
            return response.getBody();
        } catch (RestClientException e) {
            System.out.println("검색 API 요청 실패: " + e.getMessage());
            return "{}";
        }
    }

    // API 2: 관심 주식 추가
    public void addWatchlist(String ticker, String stockName) {
        AppUser user = getCurrentUser();

        // 중복 추가 방지
        if (watchlistRepository.existsByUserAndTicker(user, ticker)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 추가된 주식입니다.");
        }

        watchlistRepository.save(new WatchlistItem(ticker, stockName, user));
    }

    // API 3: 관심 주식 삭제
    public void removeWatchlist(Long watchlistItemId) {
        AppUser user = getCurrentUser();
        WatchlistItem item = watchlistRepository.findById(watchlistItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 항목입니다."));
        if (!item.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "삭제 권한이 없습니다.");
        }
        watchlistRepository.deleteById(watchlistItemId);
    }

    // 관심 주식 목록 조회
    public List<WatchlistItem> getWatchlist() {
        AppUser user = getCurrentUser();
        return watchlistRepository.findByUser(user);
    }
}
