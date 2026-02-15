package com.example.donzoom.dto.stock.response;

import com.example.donzoom.entity.StockWallet;
import lombok.Builder;
import lombok.Getter;

@Getter
public class StockWalletResponseDto {

  private final Long stockWalletId;     // 보유 주식 ID
  private final Long stockId;           // 주식 ID
  private final String stockName;       // 주식 이름
  private final Integer totalInvestedPrice; // 총 매입 금액
  private final Integer amount;         // 보유한 주식 수량
  private final Integer averagePrice;     // 평균 매입 단가

  @Builder
  public StockWalletResponseDto(StockWallet stockWallet) {
    this.stockWalletId = stockWallet.getId();
    this.stockId = stockWallet.getStock().getId();
    this.stockName = stockWallet.getStock().getStockName();
    this.totalInvestedPrice = stockWallet.getTotalInvestedPrice();
    this.amount = stockWallet.getAmount();
    this.averagePrice = stockWallet.getAveragePrice();
  }
}
