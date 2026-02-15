package com.example.donzoom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PasswordService {

  private final BCryptPasswordEncoder bCryptPasswordEncoder;

  public String encode(String password) {
    return bCryptPasswordEncoder.encode(password);
  }

  // 입력한 비밀번호와 저장된 해시된 비밀번호를 비교
  public boolean matches(String rawPassword, String encodedPassword) {
    return bCryptPasswordEncoder.matches(rawPassword, encodedPassword);
  }
}