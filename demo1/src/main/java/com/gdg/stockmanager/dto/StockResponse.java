package com.gdg.stockmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

// 차트 데이터 리스트와 AI 예측 가격을 한 번에 담아 프론트엔드로 보낼 객체
@Getter
@AllArgsConstructor
public class StockResponse {
    private final List<ChartDataDto> chartData; // 기존 1개월치 일별 종가 데이터 리스트
    private final float predictedPrice;         // AI 모델이 예측한 다음 날 주가
}