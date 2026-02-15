package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BankUserResponseDto {

  private final String userId;
  private final String userName;
  private final String institutionCode;
  private final String userKey;
  private final String created;
  private final String modified;
}
