package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TransactionDto {

  private final String transactionUniqueNo;
  private final String transactionDate;
  private final String transactionTime;
  private final String transactionType;
  private final String transactionTypeName;
  private final String transactionAccountNo;
  private final String transactionBalance;
  private final String transactionAfterBalance;
  private final String transactionSummary;
  private final String transactionMemo;

}
