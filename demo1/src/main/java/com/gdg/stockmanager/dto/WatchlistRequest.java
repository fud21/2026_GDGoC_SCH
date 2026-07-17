package com.gdg.stockmanager.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WatchlistRequest {
    private String ticker;
    private String stockName;
}
