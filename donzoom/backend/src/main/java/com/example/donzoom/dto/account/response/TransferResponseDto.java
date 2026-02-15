package com.example.donzoom.dto.account.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TransferResponseDto {

  private HeaderDto Header;
  private List<TransferRecDto> REC;
}
