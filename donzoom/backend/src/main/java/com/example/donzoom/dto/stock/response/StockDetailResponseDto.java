package com.example.donzoom.dto.stock.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockDetailResponseDto {

  private Long stockId;
  private String stockName;
  private Float stockPrice;
  private LocalDateTime lastCreatedAt;

}
