package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountHolderResponseDto {

  private HeaderDto Header;
  private AccountHolderRecDto REC;
}
