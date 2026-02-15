package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateCardRecDto {

  private final String cardNo;
  private final String cvc;
  private final String cardUniqueNo;
  private final String cardIssuerCode;
  private final String cardIssuerName;
  private final String cardName;
  private final String baselinePerformance;
  private final String maxBenefitLimit;
  private final String cardDescription;
  private final String cardExpiryDate;
  private final String withdrawalAccountNo;
  private final String withdrawalData;
}
