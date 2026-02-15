package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GetUserDataResponseByAccountNumberDto {

  private String bankCode;
  private String bankName;
  private String accountNo;
  private String userEmail;
  private String userNickName;
  private String userName;

}
