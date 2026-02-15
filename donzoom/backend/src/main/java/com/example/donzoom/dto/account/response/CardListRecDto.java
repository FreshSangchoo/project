package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CardListRecDto {

  private final String cardNo;
  private final String cvc;
  private final String withdrawalAccountNo;
}
