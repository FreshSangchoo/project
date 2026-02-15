package com.example.donzoom.dto.account.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateAccountRequestDto {

  private final String paymentPassword;

  @JsonCreator
  public CreateAccountRequestDto(@JsonProperty("paymentPassword") String paymentPassword) {
    this.paymentPassword = paymentPassword;
  }
}
