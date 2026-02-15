package com.example.donzoom.constant;

import lombok.Getter;

@Getter
public enum LoginMessage {
  WRONG_LOGIN_REQUEST("잘못된 로그인 시도입니다");

  private final String value;

  LoginMessage(String value) {
    this.value = value;
  }

}
