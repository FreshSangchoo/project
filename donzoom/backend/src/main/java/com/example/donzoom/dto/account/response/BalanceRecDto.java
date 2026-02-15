package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BalanceRecDto {

  private final String bankCode;
  private final String accountNo;
  private final String accountCreatedDate;
  private final String accountExpiryDate;
  private final String accountBalance;
  private final String lastTransactionDate;
  private final String currency;
}
