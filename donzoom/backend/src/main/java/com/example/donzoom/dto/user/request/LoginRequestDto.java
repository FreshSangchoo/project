package com.example.donzoom.dto.user.request;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
@Builder
public class LoginRequestDto {

  // UserController에서 로그인 요청 시 사용자 정보를 받는 Dto 입니다.
  private final String email;
  private final String password;
  private final String deviceToken;
}
