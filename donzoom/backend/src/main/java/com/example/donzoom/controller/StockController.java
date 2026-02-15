package com.example.donzoom.controller;

import com.example.donzoom.dto.news.response.NewsSimpleResponseDto;
import com.example.donzoom.dto.stock.request.StockRequestDto;
import com.example.donzoom.dto.stock.response.StockResponseDto;
import com.example.donzoom.dto.stock.response.StockSimpleResponseDto;
import com.example.donzoom.dto.stock.response.StockTransactionHistoryResponseDto;
import com.example.donzoom.dto.stock.response.StockTransactionHistorySimpleResponseDto;
import com.example.donzoom.dto.stock.response.StockWalletSimpleResponseDto;
import com.example.donzoom.entity.StockHistory;
import com.example.donzoom.entity.StockHistory1m;
import com.example.donzoom.repository.StockHistory1mRepository;
import com.example.donzoom.service.StockService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/stock")
public class StockController {

  private final StockHistory1mRepository stockHistory1mRepository;
  private final StockService stockService;
  private final SimpMessagingTemplate messagingTemplate;

  // 모든 주식 조회(이름, 현재가)
  @GetMapping
  public ResponseEntity<StockSimpleResponseDto> getAllStocks() {
    StockSimpleResponseDto allStocks = stockService.getAllStocks();
    return ResponseEntity.ok().body(allStocks);
  }

  // 주식 상세 조회
  @GetMapping("/{stockId}/{interval}")
  public ResponseEntity<StockResponseDto> getStockById(
      @PathVariable(name = "stockId") Long stockId,
      @PathVariable(name="interval") String interval
  ) {
    StockResponseDto stock = stockService.getStockById(stockId,interval);

    return ResponseEntity.ok().body(stock);
  }

  @PostMapping("/bulk")
  public ResponseEntity<String> saveStockData(@RequestBody List<StockRequestDto> stockDataList) {
    try {
      stockService.saveAll(stockDataList);
      return ResponseEntity.ok("Data saved successfully");
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error saving data");
    }
  }

  // 주식 정보 받아오기 및 현재가 갱신
  @PostMapping("/{stockId}")
  public ResponseEntity<?> addStockHistory(@PathVariable(name = "stockId") Long stockId,
      @RequestBody StockRequestDto stockRequestDto) {
    Long stockHistoryId = stockService.createStockHistory(stockId, stockRequestDto);
    String interval = stockRequestDto.getInterval();
    log.info(interval);
    // 여기서 WebSocket 전송
    if(interval.equals("1m")) {
      StockHistory1m stockHistory = stockHistory1mRepository.findById(stockHistoryId).orElseThrow();
      messagingTemplate.convertAndSend("/topic/stock/" + stockId, stockHistory);
    }
    return ResponseEntity.ok().body(stockHistoryId);
  }

  // 보유주식 가져오기
  @GetMapping("/my/{userId}")
  public ResponseEntity<StockWalletSimpleResponseDto> getMyStocks(
      @PathVariable(name = "userId", required = false) Long userId) {
    StockWalletSimpleResponseDto allMyStock = stockService.getAllStocks(userId);
    return ResponseEntity.ok().body(allMyStock);
  }

  // 주식종목별 보유주식 가져오기
  @GetMapping("/my/{userId}/{stockId}")
  public ResponseEntity<StockWalletSimpleResponseDto> getStock(
      @PathVariable(name = "userId") Long userId, @PathVariable(name = "stockId") Long stockId) {
    StockWalletSimpleResponseDto stock = stockService.getStock(userId, stockId);
    return ResponseEntity.ok().body(stock);
  }

  // 내 거래내역 가져오기
  @GetMapping("/myhistory/{userId}")
  public ResponseEntity<StockTransactionHistorySimpleResponseDto> getMyTransactionHistory(
      @PathVariable(name = "userId") Long userId) {
    StockTransactionHistorySimpleResponseDto allMyHistories = stockService.getAllTransaction(
        userId);
    return ResponseEntity.ok().body(allMyHistories);
  }

  // 종목별 거래내역 가져오기
  @GetMapping("/myhistory/{stockId}/{userId}")
  public ResponseEntity<StockTransactionHistorySimpleResponseDto> getMyTransactionHistoryByStockId(
      @PathVariable(name = "stockId") Long stockId, @PathVariable(name = "userId") Long userId) {
    StockTransactionHistorySimpleResponseDto historiesByStockId = stockService.getTransaction(
        stockId, userId);
    return ResponseEntity.ok().body(historiesByStockId);
  }

  // 주식 매수
  @PostMapping("/{stockId}/buy")
  public ResponseEntity<?> buyStocks(@PathVariable(name = "stockId") Long stockId,
      @RequestParam(name = "amount") Integer amount) {
    StockTransactionHistoryResponseDto transaction = stockService.buyStocks(stockId, amount);
    return ResponseEntity.ok().body(transaction);
  }

  // 주식 매도
  @PostMapping("/{stockId}/sell")
  public ResponseEntity<?> sellStocks(@PathVariable(name = "stockId") Long stockId,
      @RequestParam(name = "amount") Integer amount) {
    StockTransactionHistoryResponseDto transaction = stockService.sellStocks(stockId, amount);
    return ResponseEntity.ok().body(transaction);
  }

  // 뉴스 가져오기
  @GetMapping("/{stockId}/news")
  public ResponseEntity<?> getArticle(@PathVariable(name = "stockId") Long stockId) {
    NewsSimpleResponseDto recentNews = stockService.getRecentArticles(stockId);
    return ResponseEntity.ok().body(recentNews);
  }

}
