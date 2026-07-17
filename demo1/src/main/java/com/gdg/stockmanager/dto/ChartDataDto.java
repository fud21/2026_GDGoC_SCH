package com.gdg.stockmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

// 주식 데이터 구조화(Chat.js 맞춤)
@Getter
@AllArgsConstructor
public class ChartDataDto
{
    private final String date;
    private final double closePrice;
}
