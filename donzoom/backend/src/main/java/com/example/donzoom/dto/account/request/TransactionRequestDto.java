package com.example.donzoom.dto.account.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TransactionRequestDto {

  private final String accountNo;
  private final String startDate;
  private final String endDate;
  private final String transactionType;
  private final String orderByType;
}
