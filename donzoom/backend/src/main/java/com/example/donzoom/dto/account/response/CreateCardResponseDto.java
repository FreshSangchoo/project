package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateCardResponseDto {

  private HeaderDto Header;
  private CreateCardRecDto REC;
}
