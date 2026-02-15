package com.example.donzoom.util;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

public class SecurityUtil {

  // 현재 인증된 사용자의 username을 가져오는 유틸리티 메서드
  public static String getAuthenticatedUsername() {
    Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

    if (principal instanceof UserDetails userdetails) {
      return userdetails.getUsername(); // username 또는 email
    } else {
      return principal.toString(); // 사용자 이름이 아닌 경우 (익명 사용자 등)
    }
  }
}
