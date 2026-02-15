package com.example.donzoom.entity;

import com.example.donzoom.constant.TransactionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
public class TransactionHistory extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "transaction_history_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "wallet_id")
  private Wallet wallet;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "stock_id")
  private Stock stock;

  // 거래타입
  @Enumerated(EnumType.STRING)
  private TransactionType transactionType;

  // 매수 또는 매도 가격
  private Integer price;

  // 매수 또는 매도 수량
  private Integer amount;

  // 총 거래 금액 (단가 * 수량)
  private Integer total;

  // 발생 수익
  private Integer profit;

  @Builder
  public TransactionHistory(Wallet wallet, Stock stock, Integer price, Integer amount,
      Integer total, Integer profit, TransactionType transactionType) {
    this.wallet = wallet;
    this.stock = stock;
    this.price = price;
    this.amount = amount;
    this.total = total;
    this.profit = profit;
    this.transactionType = transactionType;
  }
}
