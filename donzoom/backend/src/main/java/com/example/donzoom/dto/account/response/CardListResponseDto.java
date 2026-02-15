package com.example.donzoom.dto.account.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CardListResponseDto {

  private final HeaderDto Header;
  private final List<CardListRecDto> REC;
}
