package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountHolderRecDto {

  private final String bankCode;
  private final String bankName;
  private final String accountNo;
  private final String userName;
  private final String currency;
}
