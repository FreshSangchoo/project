package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TransferRecDto {

  private final String transactionUniqueNo;
  private final String accountNo;
  private final String transactionDate;
  private final String transactionType;
  private final String transactionTypeName;
  private final String transactionAccountNo;
}
