package com.example.donzoom.dto.stockHistory.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockHistoryResponseDto {

  private Long stockHistoryId;
  private Integer open;
  private Integer close;
  private Integer high;
  private Integer low;
  private LocalDateTime createdAt;

}
