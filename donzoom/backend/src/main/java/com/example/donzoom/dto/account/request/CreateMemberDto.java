package com.example.donzoom.dto.account.request;


import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateMemberDto {

  private final String apiKey;
  private final String userId;
}
