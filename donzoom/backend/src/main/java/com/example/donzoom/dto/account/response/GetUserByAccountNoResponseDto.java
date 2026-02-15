package com.example.donzoom.dto.account.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GetUserByAccountNoResponseDto {

  private String accountNo;
  private String nickName;
  private String name;
}
