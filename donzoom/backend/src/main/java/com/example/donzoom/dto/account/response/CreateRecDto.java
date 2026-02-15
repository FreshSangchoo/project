package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;


@Getter
@Builder
public class CreateRecDto {

  private final String bankCode;
  private final String accountNo;
  private final CurrencyDto currency;
}
