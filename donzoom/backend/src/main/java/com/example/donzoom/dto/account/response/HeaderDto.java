package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HeaderDto {

  private String responseCode;
  private String responseMessage;
  private String apiName;
  private String transmissionDate;
  private String transmissionTime;
  private String institutionCode;

}
