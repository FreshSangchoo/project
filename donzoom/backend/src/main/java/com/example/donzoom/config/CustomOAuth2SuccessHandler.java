package com.example.donzoom.config;

import com.example.donzoom.dto.user.CustomOAuth2User;
import com.example.donzoom.util.JWTUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;
import java.util.Iterator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomOAuth2SuccessHandler implements AuthenticationSuccessHandler {

  private final JWTUtil jwtUtil;
  @Value("${jwt.oauth.token.expireTime}")
  long jwtOAuthTokenExpireTime;
  @Value("${frontend.uri}")
  private String frontendUrl;

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
      Authentication authentication) throws IOException, ServletException {

    CustomOAuth2User customOAuth2User = (CustomOAuth2User) authentication.getPrincipal();
    String email = customOAuth2User.getEmail();

    // 회원가입
    if (customOAuth2User.hasNoRole()) {
      log.info("ROLE이 없을경우 현재 회원가입으로 보내버림");
      log.info("회원가입 창으로 이동합니다.");
      response.sendRedirect(frontendUrl + "/auth/register/?email=" + email);
    } else {
      // 로그인
      Collection<? extends GrantedAuthority> authorities = customOAuth2User.getAuthorities();
      Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
      GrantedAuthority authority = iterator.next();
      String role = authority.getAuthority();

      // JWT 토큰 발급
      String token = jwtUtil.createOauthJwt(email, role);
      log.info("OAuth2에서 임시 JWT를 발급한 뒤 쿠키에 담아 보냈습니다. = {} ", token);

      response.addCookie(createCookie("OAuthAuthorization", token));

      // 프론트 엔드 주소 -> /auth/request
      response.sendRedirect(frontendUrl + "/auth-success");
    }

  }

  private Cookie createCookie(String key, String value) {

    Cookie cookie = new Cookie(key, value);
    cookie.setMaxAge((int) jwtOAuthTokenExpireTime);
    //cookie.setSecure(true);
    cookie.setPath("/");
    cookie.setHttpOnly(true);

    return cookie;
  }
}