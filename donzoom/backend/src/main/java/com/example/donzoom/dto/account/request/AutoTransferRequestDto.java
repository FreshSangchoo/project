package com.example.donzoom.dto.account.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AutoTransferRequestDto {

  private final String depositAccountNo;
  private final Long transactionBalance;
  private final String withdrawalAccountNo;
  private final String transferDate;  // 매월 이체될 날짜
}
