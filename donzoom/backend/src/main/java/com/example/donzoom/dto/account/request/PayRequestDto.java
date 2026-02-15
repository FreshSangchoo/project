package com.example.donzoom.dto.account.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PayRequestDto {

  private final String cardNo;
  private final String cvc;
  private final String merchantId;
  private final Long paymentBalance;
}
