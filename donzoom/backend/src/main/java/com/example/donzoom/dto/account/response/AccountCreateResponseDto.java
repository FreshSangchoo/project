package com.example.donzoom.dto.account.response;


import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountCreateResponseDto {

  private HeaderDto Header;
  private CreateRecDto REC;

}
