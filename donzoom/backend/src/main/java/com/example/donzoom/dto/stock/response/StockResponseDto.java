package com.example.donzoom.dto.stock.response;

import com.example.donzoom.dto.stockHistory.response.StockHistoryResponseDto;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockResponseDto {

  private Long stockId;
  private String stockName;
  private List<StockHistoryResponseDto> stockHistories;

}
