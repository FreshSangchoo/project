package com.example.donzoom.dto.user.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OauthUserCreateDto {

  @NotBlank(message = "이메일은 필수 입력 사항입니다.")
  @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$", message = "유효한 이메일 형식을 입력하세요.")
  private String email;
}
