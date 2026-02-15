package com.example.donzoom.dto.savings.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SavingsDetailResponseDto {
  private double currentPaidAmount; // 현재 납부 현황
  private double monthlyDeposit;    // 월 납입액
  private double expectedMaturityAmount; // 만기 환급액
  private double expectedMaturityProfit; // 만기 예상 수익
  private String nextPaymentDue;    // 다음 납기일
  private String maturityDate;      // 만기일
}
