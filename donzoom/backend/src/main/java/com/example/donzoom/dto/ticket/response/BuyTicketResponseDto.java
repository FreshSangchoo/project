package com.example.donzoom.dto.ticket.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BuyTicketResponseDto {
  private final Integer lastCoin;
  private final Integer lastTicket;
}
