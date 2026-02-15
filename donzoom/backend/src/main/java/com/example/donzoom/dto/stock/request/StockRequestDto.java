package com.example.donzoom.dto.stock.request;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockRequestDto {

  private Long stockId;
  private Integer open;
  private Integer close;
  private Integer high;
  private Integer low;
  private LocalDateTime createdAt;
  private String interval;
}
