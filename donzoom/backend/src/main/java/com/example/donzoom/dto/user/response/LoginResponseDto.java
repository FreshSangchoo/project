package com.example.donzoom.dto.user.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponseDto {

  // UserService에서 UserController로 login 응답시 사용하는 Dto입니다.
  private final String accessToken;
  private final String refreshToken;
  private final String name;
}
