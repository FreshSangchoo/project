package com.example.donzoom.dto.account.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ValidatePaymentPasswordRequestDto {

  private final String paymentPassword;

  @JsonCreator
  public ValidatePaymentPasswordRequestDto(
      @JsonProperty("paymentPassword") String paymentPassword) {
    this.paymentPassword = paymentPassword;
  }
}
