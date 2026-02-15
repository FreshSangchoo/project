package com.example.donzoom.service;

import com.example.donzoom.constant.TransactionType;
import com.example.donzoom.dto.news.response.NewsResponseDto;
import com.example.donzoom.dto.news.response.NewsSimpleResponseDto;
import com.example.donzoom.dto.stock.request.StockRequestDto;
import com.example.donzoom.dto.stock.response.StockDetailResponseDto;
import com.example.donzoom.dto.stock.response.StockResponseDto;
import com.example.donzoom.dto.stock.response.StockSimpleResponseDto;
import com.example.donzoom.dto.stock.response.StockTransactionHistoryResponseDto;
import com.example.donzoom.dto.stock.response.StockTransactionHistorySimpleResponseDto;
import com.example.donzoom.dto.stock.response.StockWalletResponseDto;
import com.example.donzoom.dto.stock.response.StockWalletSimpleResponseDto;
import com.example.donzoom.dto.stockHistory.response.StockHistoryResponseDto;
import com.example.donzoom.entity.News;
import com.example.donzoom.entity.Stock;
import com.example.donzoom.entity.StockHistory;
import com.example.donzoom.entity.StockHistory1d;
import com.example.donzoom.entity.StockHistory1m;
import com.example.donzoom.entity.StockHistory1mo;
import com.example.donzoom.entity.StockHistory1wk;
import com.example.donzoom.entity.StockWallet;
import com.example.donzoom.entity.TransactionHistory;
import com.example.donzoom.entity.User;
import com.example.donzoom.entity.Wallet;
import com.example.donzoom.repository.NewsRepository;
import com.example.donzoom.repository.StockHistory1dRepository;
import com.example.donzoom.repository.StockHistory1mRepository;
import com.example.donzoom.repository.StockHistory1moRepository;
import com.example.donzoom.repository.StockHistory1wkRepository;
import com.example.donzoom.repository.StockRepository;
import com.example.donzoom.repository.StockWalletRepository;
import com.example.donzoom.repository.TransactionHistoryRepository;
import com.google.firebase.messaging.FirebaseMessagingException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockService {

  private final NewsRepository newsRepository;
  private final StockWalletRepository stockWalletRepository;
  private final StockRepository stockRepository;
  private final TransactionHistoryRepository transactionHistoryRepository;
  private final WalletService walletService;
  private final UserService userService;
  private final FCMService fcmService;
  private final StockHistory1dRepository stockHistory1dRepository;
  private final StockHistory1wkRepository stockHistory1wkRepository;
  private final StockHistory1moRepository stockHistory1moRepository;
  private final StockHistory1mRepository stockHistory1mRepository;

  // 주식 전종목 조회
  @Transactional(readOnly = true)
  public StockSimpleResponseDto getAllStocks() {
    List<Long> stockIds = stockRepository.findAll().stream().map(Stock::getId).toList();
    log.info("getAllStocks: {}", stockIds);

    List<StockDetailResponseDto> stockDtos = stockIds.stream().map(stockId -> {
      StockHistory1m stockHistory = stockHistory1mRepository.findTop1ByStockIdOrderByCreatedAtDesc(
          stockId);
      Stock stock = stockRepository.findById(stockId).orElseThrow(); // 필요시 예외 처리

      return StockDetailResponseDto.builder().stockId(stock.getId()).stockName(stock.getStockName())
          .stockPrice(stockHistory != null ? stockHistory.getClose() : 0.0f).lastCreatedAt(
              stockHistory != null ? stockHistory.getCreatedAt() : LocalDateTime.now())  // 기본값 처리
          .build();
    }).toList();

    return StockSimpleResponseDto.builder().stocks(stockDtos).build();
  }


  // 주식 상세 조회
  @Transactional(readOnly = true)
  public StockResponseDto getStockById(Long stockId, String interval) {
    Stock stock = stockRepository.findById(stockId).orElseThrow();
    switch (interval) {
      case "min" -> {
        List<StockHistory1m> stockHistories = stockHistory1mRepository.findByStockId(stockId);
        List<StockHistoryResponseDto> stockHistoryDtos = stockHistories.stream().map(
            stockHistory -> StockHistoryResponseDto.builder().stockHistoryId(stockHistory.getId())
                .open(stockHistory.getOpen()).close(stockHistory.getClose())
                .high(stockHistory.getHigh()).low(stockHistory.getLow())
                .createdAt(stockHistory.getCreatedAt()).build()).toList();
        return StockResponseDto.builder().stockId(stock.getId()).stockName(stock.getStockName())
            .stockHistories(stockHistoryDtos).build();
      }
      case "day" -> {
        List<StockHistory1d> stockHistories = stockHistory1dRepository.findByStockId(stockId);
        List<StockHistoryResponseDto> stockHistoryDtos = stockHistories.stream().map(
            stockHistory -> StockHistoryResponseDto.builder().stockHistoryId(stockHistory.getId())
                .open(stockHistory.getOpen()).close(stockHistory.getClose())
                .high(stockHistory.getHigh()).low(stockHistory.getLow())
                .createdAt(stockHistory.getCreatedAt()).build()).toList();
        return StockResponseDto.builder().stockId(stock.getId()).stockName(stock.getStockName())
            .stockHistories(stockHistoryDtos).build();
      }
      case "week" -> {
        List<StockHistory1wk> stockHistories = stockHistory1wkRepository.findByStockId(stockId);
        List<StockHistoryResponseDto> stockHistoryDtos = stockHistories.stream().map(
            stockHistory -> StockHistoryResponseDto.builder().stockHistoryId(stockHistory.getId())
                .open(stockHistory.getOpen()).close(stockHistory.getClose())
                .high(stockHistory.getHigh()).low(stockHistory.getLow())
                .createdAt(stockHistory.getCreatedAt()).build()).toList();
        return StockResponseDto.builder().stockId(stock.getId()).stockName(stock.getStockName())
            .stockHistories(stockHistoryDtos).build();
      }
      case "month" -> {
        List<StockHistory1mo> stockHistories = stockHistory1moRepository.findByStockId(stockId);
        List<StockHistoryResponseDto> stockHistoryDtos = stockHistories.stream().map(
            stockHistory -> StockHistoryResponseDto.builder().stockHistoryId(stockHistory.getId())
                .open(stockHistory.getOpen()).close(stockHistory.getClose())
                .high(stockHistory.getHigh()).low(stockHistory.getLow())
                .createdAt(stockHistory.getCreatedAt()).build()).toList();
        return StockResponseDto.builder().stockId(stock.getId()).stockName(stock.getStockName())
            .stockHistories(stockHistoryDtos).build();
      }
    }
    throw new RuntimeException("주식 정보를 불러오는 중 오류가 발생했습니다");
  }

  // 내가 보유한 주식 상세 조회
  @Transactional(readOnly = true)
  public StockWalletSimpleResponseDto getStock(Long userId, Long stockId) {
    Long walletId = getWalletId(userId);

    List<StockWalletResponseDto> stockWalletDtos = stockWalletRepository.findByWalletId(walletId)
        .stream().filter(stockWallet -> {
          return stockWallet.getStock().getId().equals(stockId);
        }).map(stockWallet -> StockWalletResponseDto.builder().stockWallet(stockWallet).build())
        .toList();

    return StockWalletSimpleResponseDto.builder().myStocks(stockWalletDtos).build();
  }

  // 내가 가진 주식 전부 조회
  @Transactional(readOnly = true)
  public StockWalletSimpleResponseDto getAllStocks(Long userId) {
    Long walletId = getWalletId(userId);

    List<StockWalletResponseDto> stockWalletDtos = stockWalletRepository.findByWalletId(walletId)
        .stream()
        .map(stockWallet -> StockWalletResponseDto.builder().stockWallet(stockWallet).build())
        .toList();

    return StockWalletSimpleResponseDto.builder().myStocks(stockWalletDtos).build();
  }

  // 모든 주식 거래내역 조회
  @Transactional(readOnly = true)
  public StockTransactionHistorySimpleResponseDto getAllTransaction(Long userId) {
    Long walletId = getWalletId(userId);

    List<StockTransactionHistoryResponseDto> transactionHistoryDtos = transactionHistoryRepository.findByWalletId(
        walletId).stream().map(transactionHistory -> StockTransactionHistoryResponseDto.builder()
        .transactionHistoryId(transactionHistory.getId())
        .stockId(transactionHistory.getStock().getId())
        .transactionType(transactionHistory.getTransactionType())
        .price(transactionHistory.getPrice()).amount(transactionHistory.getAmount())
        .total(transactionHistory.getPrice() * transactionHistory.getAmount())
        .profit(transactionHistory.getProfit()).createdAt(transactionHistory.getCreatedAt())
        .build()).toList();

    return StockTransactionHistorySimpleResponseDto.builder().myHistories(transactionHistoryDtos)
        .build();
  }

  // 주식 종목별 거래내역 조회
  @Transactional(readOnly = true)
  public StockTransactionHistorySimpleResponseDto getTransaction(Long stockId, Long userId) {
    Long walletId = getWalletId(userId);

    List<StockTransactionHistoryResponseDto> transactionHistoryDtos = transactionHistoryRepository.findByWalletIdAndStockId(
        walletId, stockId).stream().map(
        transactionHistory -> StockTransactionHistoryResponseDto.builder()
            .transactionHistoryId(transactionHistory.getId())
            .stockId(transactionHistory.getStock().getId())
            .transactionType(transactionHistory.getTransactionType())
            .price(transactionHistory.getPrice()).amount(transactionHistory.getAmount())
            .total(transactionHistory.getPrice() * transactionHistory.getAmount())
            .profit(transactionHistory.getProfit()).createdAt(transactionHistory.getCreatedAt())
            .build()).toList();

    return StockTransactionHistorySimpleResponseDto.builder().myHistories(transactionHistoryDtos)
        .build();
  }

  // 매수
  @Transactional
  public StockTransactionHistoryResponseDto buyStocks(Long stockId, Integer amount) {
    Long walletId = walletService.findCurrentWallet().getId();

    // 내 지갑 찾아오기
    Wallet myWallet = walletService.findCurrentWallet();

    // 주식 들고오기
    Stock stock = stockRepository.findById(stockId)
        .orElseThrow(() -> new NoSuchElementException("Stock not found"));

    // 주식 현재가 들고오기
    StockHistory1m recentPrice = stockHistory1mRepository.findTop1ByStockIdOrderByCreatedAtDesc(
        stockId);

    // 지갑 내 유동자산 비교
    Integer requiredPrice = recentPrice.getClose() * amount;
    if (walletService.getCurrentUserCoin() < requiredPrice) {
      throw new RuntimeException("Not enough money");
    }

    // 매수에 따른 코인 차감
    walletService.updateCoin(requiredPrice * -1);

    // 이미 보유한 주식인지 확인
    List<Long> myStockId = stockWalletRepository.findByWalletId(walletId).stream()
        .map(stockWallet -> stockWallet.getStock().getId()).toList();

    // 이미 있는 주식이라면,
    if (myStockId.contains(stockId)) {

      // 기존 주식 업데이트
      StockWallet preStock = stockWalletRepository.findByWalletIdAndStockId(walletId, stockId)
          .orElseThrow(() -> new NoSuchElementException("Stock not found"));

      // 총 투자 금액과 평단가 업데이트
      Integer newTotalInvestedPrice = preStock.getTotalInvestedPrice() + requiredPrice;
      Integer newTotalAmount = preStock.getAmount() + amount;

      preStock.updateInvestment(newTotalInvestedPrice, newTotalAmount);

    } else {

      // 처음 사는 주식이라면,

      // 새로운 주식 매수
      StockWallet newStock = StockWallet.builder().wallet(myWallet).stock(stock)
          .totalInvestedPrice(requiredPrice)  // 초기 투자 금액
          .amount(amount)                      // 초기 수량
          .averagePrice(recentPrice.getClose()) // 초기 평단가
          .build();

      stockWalletRepository.save(newStock);
    }

    // 거래 내역 기록
    Long transactionHistoryId = createTransactionHistory(myWallet, stock, recentPrice.getClose(),
        amount, requiredPrice, 0, TransactionType.BUY);

    TransactionHistory transactionHistory = transactionHistoryRepository.findById(
        transactionHistoryId).orElseThrow();
    User user = userService.findCurrentUser();
    try {
      String stockName = stock.getStockName();
      Integer close = recentPrice.getClose();
      fcmService.sendNotification(user,"매수 성공",stockName+" "+close+"머니"+" "+amount+"주 매수");
    } catch (FirebaseMessagingException e) {
      log.error("FCM 메세지를 보내는데 실패했습니다. {}", e.getMessage());
    }

    return StockTransactionHistoryResponseDto.builder()
        .transactionHistoryId(transactionHistory.getId())
        .stockId(transactionHistory.getStock().getId())
        .transactionType(transactionHistory.getTransactionType())
        .price(transactionHistory.getPrice()).amount(transactionHistory.getAmount())
        .total(transactionHistory.getPrice() * transactionHistory.getAmount())
        .profit(transactionHistory.getProfit()).createdAt(transactionHistory.getCreatedAt())
        .build();

  }

  // 매도
  @Transactional
  public StockTransactionHistoryResponseDto sellStocks(Long stockId, Integer amount) {

    // 내 지갑 찾아오기
    Wallet myWallet = walletService.findCurrentWallet();
    Long walletId = myWallet.getId();

    // 주식 들고오기
    Stock stock = stockRepository.findById(stockId)
        .orElseThrow(() -> new NoSuchElementException("Stock not found"));

    // 주식 현재가 들고오기
    StockHistory1m recentPrice = stockHistory1mRepository.findTop1ByStockIdOrderByCreatedAtDesc(
        stockId);

    // 내가 보유중인 주식인지 확인
    StockWallet preStock = stockWalletRepository.findByWalletIdAndStockId(walletId, stockId)
        .orElseThrow(() -> new NoSuchElementException("Stock not found"));

    // 매도할 수량이 충분한지 확인
    if (preStock.getAmount() < amount) {
      throw new RuntimeException("Insufficient amount");
    }

    // 실현 수익 계산
    Integer realizedProfit = (recentPrice.getClose() - preStock.getAveragePrice()) * amount;

    // 지갑에 실현된 금액 추가
    walletService.updateCoin(recentPrice.getClose() * amount);

    if (preStock.getAmount().equals(amount)) {
      // 모든 주식을 매도한 경우 삭제
      stockWalletRepository.delete(preStock);

    } else {
      // 남은 주식의 총 투자 금액과 수량 업데이트
      Integer remainingInvestedPrice =
          preStock.getTotalInvestedPrice() - preStock.getAveragePrice() * amount;
      Integer remainingAmount = preStock.getAmount() - amount;

      preStock.updateInvestment(remainingInvestedPrice, remainingAmount);

    }

    // 거래 내역 기록
    Long transactionHistoryId = createTransactionHistory(myWallet, stock, recentPrice.getClose(),
        amount, recentPrice.getClose() * amount, realizedProfit, TransactionType.SELL);

    TransactionHistory transactionHistory = transactionHistoryRepository.findById(
        transactionHistoryId).orElseThrow();

    User user = userService.findCurrentUser();
    try {
      String stockName = stock.getStockName();
      Integer close = recentPrice.getClose();
      fcmService.sendNotification(user,"매도 성공",stockName+" "+close+"머니"+" "+amount+"주 매도");
    } catch (FirebaseMessagingException e) {
      log.error("FCM 메세지를 보내는데 실패했습니다. {}", e.getMessage());
    }

    return StockTransactionHistoryResponseDto.builder()
        .transactionHistoryId(transactionHistory.getId())
        .stockId(transactionHistory.getStock().getId())
        .transactionType(transactionHistory.getTransactionType())
        .price(transactionHistory.getPrice()).amount(transactionHistory.getAmount())
        .total(transactionHistory.getPrice() * transactionHistory.getAmount())
        .profit(transactionHistory.getProfit()).createdAt(transactionHistory.getCreatedAt())
        .build();
  }

  @Transactional
  public void saveAll(List<StockRequestDto> stockDataList) {
    for (StockRequestDto stockRequestDto : stockDataList) {
      Long stockId = stockRequestDto.getStockId();
      Stock stock = stockRepository.findById(stockId)
          .orElseThrow(() -> new NoSuchElementException("Stock not found"));
      String interval = stockRequestDto.getInterval();
      switch (interval) {
        case "1m" -> {
          if (!stockHistory1mRepository.existsByStockIdAndCreatedAt(stockRequestDto.getStockId(),
              stockRequestDto.getCreatedAt())) {
            StockHistory1m stockHistory = StockHistory1m.builder().stock(stock)
                .open(stockRequestDto.getOpen()).close(stockRequestDto.getClose())
                .high(stockRequestDto.getHigh()).low(stockRequestDto.getLow())
                .createdAt(stockRequestDto.getCreatedAt()).build();
            stockHistory1mRepository.save(stockHistory);
          }
        }
        case "1d" -> {
          if (!stockHistory1dRepository.existsByStockIdAndCreatedAt(stockRequestDto.getStockId(),
              stockRequestDto.getCreatedAt())) {
            StockHistory1d stockHistory = StockHistory1d.builder().stock(stock)
                .open(stockRequestDto.getOpen()).close(stockRequestDto.getClose())
                .high(stockRequestDto.getHigh()).low(stockRequestDto.getLow())
                .createdAt(stockRequestDto.getCreatedAt()).build();
            stockHistory1dRepository.save(stockHistory);
          }
        }
        case "1wk" -> {
          if (!stockHistory1wkRepository.existsByStockIdAndCreatedAt(stockRequestDto.getStockId(),
              stockRequestDto.getCreatedAt())) {
            StockHistory1wk stockHistory = StockHistory1wk.builder().stock(stock)
                .open(stockRequestDto.getOpen()).close(stockRequestDto.getClose())
                .high(stockRequestDto.getHigh()).low(stockRequestDto.getLow())
                .createdAt(stockRequestDto.getCreatedAt()).build();
            stockHistory1wkRepository.save(stockHistory);
          }
        }
        case "1mo" -> {
          if (!stockHistory1moRepository.existsByStockIdAndCreatedAt(stockRequestDto.getStockId(),
              stockRequestDto.getCreatedAt())) {
            StockHistory1mo stockHistory = StockHistory1mo.builder().stock(stock)
                .open(stockRequestDto.getOpen()).close(stockRequestDto.getClose())
                .high(stockRequestDto.getHigh()).low(stockRequestDto.getLow())
                .createdAt(stockRequestDto.getCreatedAt()).build();
            stockHistory1moRepository.save(stockHistory);
          }
        }
      }
    }
  }

  // 주식 변동내역 기록
  @Transactional
  public Long createStockHistory(Long stockId, StockRequestDto stockRequestDto) {
    Stock stock = stockRepository.findById(stockId)
        .orElseThrow(() -> new NoSuchElementException("Stock not found"));
    String interval = stockRequestDto.getInterval();
    switch (interval) {
      case "1m" -> {
        StockHistory1m stockHistory = StockHistory1m.builder().stock(stock)
            .open(stockRequestDto.getOpen()).close(stockRequestDto.getClose())
            .high(stockRequestDto.getHigh()).low(stockRequestDto.getLow())
            .createdAt(stockRequestDto.getCreatedAt()).build();
        stockHistory1mRepository.save(stockHistory);
        return stockHistory.getId();
      }
      case "1d" -> {
        StockHistory1d stockHistory = StockHistory1d.builder().stock(stock)
            .open(stockRequestDto.getOpen()).close(stockRequestDto.getClose())
            .high(stockRequestDto.getHigh()).low(stockRequestDto.getLow())
            .createdAt(stockRequestDto.getCreatedAt()).build();
        stockHistory1dRepository.save(stockHistory);
        return stockHistory.getId();
      }
      case "1wk" -> {
        StockHistory1wk stockHistory = StockHistory1wk.builder().stock(stock)
            .open(stockRequestDto.getOpen()).close(stockRequestDto.getClose())
            .high(stockRequestDto.getHigh()).low(stockRequestDto.getLow())
            .createdAt(stockRequestDto.getCreatedAt()).build();
        stockHistory1wkRepository.save(stockHistory);
        return stockHistory.getId();
      }
      case "1mo" -> {
        StockHistory1mo stockHistory = StockHistory1mo.builder().stock(stock)
            .open(stockRequestDto.getOpen()).close(stockRequestDto.getClose())
            .high(stockRequestDto.getHigh()).low(stockRequestDto.getLow())
            .createdAt(stockRequestDto.getCreatedAt()).build();
        stockHistory1moRepository.save(stockHistory);
        return stockHistory.getId();
      }
    }
    return -1L;
  }

  // 주식 거래내역 기록
  @Transactional
  public Long createTransactionHistory(Wallet wallet, Stock stock, Integer price, Integer amount,
      Integer total, Integer profit, TransactionType transactionType) {

    TransactionHistory transactionHistory = TransactionHistory.builder().wallet(wallet).stock(stock)
        .price(price).amount(amount).total(total).profit(profit).transactionType(transactionType)
        .build();

    transactionHistoryRepository.save(transactionHistory);
    return transactionHistory.getId();
  }

  @Transactional(readOnly = true)
  public NewsSimpleResponseDto getRecentArticles(Long stockId) {
    List<News> recentNews = newsRepository.findTop3ByStockIdOrderByCreatedAtDesc(stockId);

    List<NewsResponseDto> articles = recentNews.stream().map(
        news -> NewsResponseDto.builder().title(news.getTitle()).contents(news.getContents())
            .createdAt(news.getCreatedAt()).build()).toList();

    return NewsSimpleResponseDto.builder().articles(articles).build();
  }

  public Long getWalletId(Long userId) {
    User loginUser = userService.findCurrentUser();
    if (loginUser.getId().equals(userId)) {
      return walletService.findWalletByUserId(userId).getId();
    } else {
      User user = userService.findUserById(userId);
      if (!loginUser.isMyChild(user)) {
        throw new NoSuchElementException("주식정보를 불러올 권한이 없습니다.");
      } else {
        return walletService.findWalletByUserId(userId).getId();
      }
    }
  }
}
