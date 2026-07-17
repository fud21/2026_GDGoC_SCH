package com.gdg.stockmanager.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

// API 응답 데이터 맵핑 클래스
@Getter
@Setter
public class YahooFinanceResponse
{
    // 최종 차트 데이터 객체
    private YahooChart chart;

    // 라트 결과 리스트 래퍼 클래스
    @Getter
    @Setter
    public static class YahooChart {
        private List<YahooChartResult> result;
    }

    // 특정 종목의 날짜와 종가 데이터 저장 클래스
    @Getter
    @Setter
    public static class YahooChartResult {
        private List<Long> timestamp;
        private YahooIndicators indicators;
    }

    // 주식 시세 지표 리스트 클래스
    @Getter
    @Setter
    public static class YahooIndicators {
        private List<YahooQuote> quote;
    }

    // 주식 주가 저장 리스트 클래스
    @Getter
    @Setter
    public static class YahooQuote {
        private List<Double> close;
    }
}
