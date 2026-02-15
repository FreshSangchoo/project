package com.example.donzoom.dto.savings.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SavingsResponseDto {
  private final double principal;   // 원금
  private final double interest;    // 예상 이자
  private final double totalAmount; // 총 예상 금액
}
