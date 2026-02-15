package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GetRecDto {

  private final String bankCode;
  private final String bankName;
  private final String userName;
  private final String accountNo;
  private final String accountName;
  private final String accountTypeCode;
  private final String accountTypeName;
  private final String accountCreatedDate;
  private final String accountExpiryDate;
  private final String dailyTransferLimit;
  private final String oneTimeTransferLimit;
  private final String accountBalance;
  private final String lastTransactionDate;
  private final String currency;
}
