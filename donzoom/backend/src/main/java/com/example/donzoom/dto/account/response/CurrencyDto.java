package com.example.donzoom.dto.account.response;


import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CurrencyDto {

  private final String currency;
  private final String currencyName;
}
