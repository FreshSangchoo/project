package com.example.donzoom.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockWallet {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "stock_wallet_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "wallet_id")
  private Wallet wallet;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "stock_id")
  private Stock stock;

  // 총 매입 금액
  private Integer totalInvestedPrice;

  // 보유한 주식의 수량
  private Integer amount;

  // 평균 매입 단가
  private Integer averagePrice;

  @Builder
  public StockWallet(Wallet wallet, Stock stock, Integer totalInvestedPrice, Integer amount,
      Integer averagePrice) {
    this.wallet = wallet;
    this.stock = stock;
    this.totalInvestedPrice = totalInvestedPrice;
    this.amount = amount;
    this.averagePrice = averagePrice;
  }

  // 매수 시 업데이트 로직: 총 매입 금액과 수량, 평단가 업데이트
  public void updateInvestment(Integer totalInvestedPrice, Integer amount) {
    this.totalInvestedPrice = totalInvestedPrice;
    this.amount = amount;
    this.averagePrice = totalInvestedPrice / amount;
  }

}
