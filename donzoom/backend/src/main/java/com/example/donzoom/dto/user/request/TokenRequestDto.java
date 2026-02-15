package com.example.donzoom.dto.user.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class TokenRequestDto {

  private String refreshToken;

  @JsonCreator
  public TokenRequestDto(@JsonProperty("refreshToken") String refreshToken) {
    this.refreshToken = refreshToken;
  }
}
