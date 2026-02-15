package com.example.donzoom.dto.user.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
@Builder
public class UserCreateDto {
  // 회원 가입 시 유저 정보를 받는 Dto입니다.

  @NotBlank(message = "이메일은 필수 입력 사항입니다.")
  @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$", message = "유효한 이메일 형식을 입력하세요.")
  private String email;

  @NotBlank(message = "비밀번호는 필수 입력 사항입니다.")
  @Size(min = 9, max = 15)
  private String password; // 여기는 Hash 값이 들어가지 않음

  @NotBlank(message = "이름은 필수 입력 사항입니다.")
  @Size(min = 2, max = 20)
  private String nickname;

  @NotBlank(message = "닉네임은 필수 입력 사항입니다.")
  @Size(min = 1, max = 10)
  private String name;

  private Boolean isParent;


}
