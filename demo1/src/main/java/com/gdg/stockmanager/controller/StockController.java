package com.gdg.stockmanager.controller;

import com.gdg.stockmanager.domain.WatchlistItem;
import com.gdg.stockmanager.dto.ChartDataDto;
import com.gdg.stockmanager.dto.StockResponse; // 방금 만든 응답용 DTO
import com.gdg.stockmanager.dto.WatchlistRequest;
import com.gdg.stockmanager.service.PredictService; // AI 예측 서비스 추가
import com.gdg.stockmanager.service.StockService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
// API URL 경로 처리 컨트롤러
@RequestMapping("/api/stock")
public class StockController {

    private final StockService stockService;
    private final PredictService predictService; // AI 예측 서비스 빈 주입을 위한 참조변수 추가

    // 생성자 : StockService와 PredictService 빈을 함께 연결
    public StockController(StockService stockService, PredictService predictService) {
        this.stockService = stockService;
        this.predictService = predictService; // AI 서비스 초기화
    }

    // 주식 차트 보여줄 HTML 페이지 반환
    @GetMapping("/page")
    public String stockPage() {
        return "stock/index";
    }

    /**
     * 특정 종목 차트 데이터(JSON)와 함께 AI의 다음 날 예측 주가를 한 번에 반환하는 API
     */
    @GetMapping("/{symbol}")
    @ResponseBody
    public StockResponse getStockData(@PathVariable String symbol) {
        // 1. 야후 파이낸스에서 여유 있게 데이터를 가져옵니다. (StockService에서 range=1mo -> 3mo 등으로 변경 권장)
        List<ChartDataDto> chartChartList = stockService.getStockChart(symbol);

        if (chartChartList == null || chartChartList.isEmpty()) {
            return new StockResponse(chartChartList, 0.0f);
        }

        // D-Linear 모델이 정확히 최근 30일 데이터를 요구하므로, 뒤에서부터 30개를 추출
        int requiredDays = 30;
        if (chartChartList.size() < requiredDays) {
            System.err.println("[경고] 수집된 데이터가 " + chartChartList.size() + "개뿐이라 예측이 불가능합니다. API range를 늘려주세요.");
            return new StockResponse(chartChartList, 0.0f);
        }

        // 가장 최근 30개 데이터만 float[] 배열로 추출
        float[] closePrices = new float[requiredDays];
        int startIndex = chartChartList.size() - requiredDays;
        for (int i = 0; i < requiredDays; i++) {
            closePrices[i] = (float) chartChartList.get(startIndex + i).getClosePrice();
        }

        // 30개의 데이터로 예측 진행
        float predictedPrice = predictService.predictNextPrice(closePrices);

        return new StockResponse(chartChartList, predictedPrice);
    }

    // 관심 주식 목록 조회
    @GetMapping("/watchlist")
    @ResponseBody
    public ResponseEntity<List<WatchlistItem>> getWatchlist() {
        return ResponseEntity.ok(stockService.getWatchlist());
    }

    // API 1: 주식 검색
    @GetMapping("/search")
    @ResponseBody
    public ResponseEntity<String> searchStock(@RequestParam String q) {
        String result = stockService.searchStock(q);
        return ResponseEntity.ok(result);
    }

    // API 2: 관심 주식 추가
    @PostMapping("/watchlist")
    @ResponseBody
    public ResponseEntity<String> addWatchlist(@RequestBody WatchlistRequest request) {
        stockService.addWatchlist(request.getTicker(), request.getStockName());
        return ResponseEntity.ok("추가 완료");
    }

    // API 3: 관심 주식 삭제
    @DeleteMapping("/watchlist/{id}")
    @ResponseBody
    public ResponseEntity<String> removeWatchlist(@PathVariable Long id) {
        stockService.removeWatchlist(id);
        return ResponseEntity.ok("삭제 완료");
    }
}
