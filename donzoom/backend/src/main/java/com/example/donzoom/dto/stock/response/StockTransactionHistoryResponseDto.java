package com.example.donzoom.dto.stock.response;

import com.example.donzoom.constant.TransactionType;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockTransactionHistoryResponseDto {

  private Long transactionHistoryId;  // 거래 내역 ID
  private Long stockId;               // 주식 ID
  private TransactionType transactionType;  // 거래 타입
  private Integer price;                // 매수 또는 매도 가격
  private Integer amount;             // 매수 또는 매도 수량
  private Integer total;                // 총 거래 금액 (price * amount)
  private Integer profit;       // 실현 수익 (매도 시에만 기록)
  private LocalDateTime createdAt;    // 거래 생성 시간

}
