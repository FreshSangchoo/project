package com.example.donzoom.dto.account.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TransferRequestDto {

  private final String depositAccountNo;
  private final String depositTransactionSummary;
  private final Long transactionBalance;
  private final String withdrawalAccountNo;
  private final String withdrawalTransactionSummary;
}
