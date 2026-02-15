package com.example.donzoom.dto.account.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateCardRequestDto {

  private final String cardUniqueNo;
  private final String withdrawalAccountNo;
  //월:1 화:2 수:3 목:4 금:5 토:6 일:7
  private final String withdrawalDate;
}
