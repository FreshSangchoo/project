package com.example.donzoom.external;

import lombok.Getter;

@Getter
public class BankApiResponseException extends RuntimeException {

  private final String responseCode;
  private final String responseMessage;

  public BankApiResponseException(String responseCode, String responseMessage) {
    super(responseMessage);
    this.responseCode = responseCode;
    this.responseMessage = responseMessage;
  }

}
