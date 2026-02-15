package com.example.donzoom.filter;

import com.example.donzoom.dto.user.CustomUserDetails;
import com.example.donzoom.entity.User;
import com.example.donzoom.service.RedisService;
import com.example.donzoom.util.JWTUtil;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@RequiredArgsConstructor
public class JWTFilter extends OncePerRequestFilter {

  private static final List<String> EXCLUDE_PATHS = Arrays.asList(

      "/users/check-email", "/auth/login", "/auth/logout", "/auth/token", "/auth/refresh", "/login",
      "/user/login", "/api/user/login", "/api/auth/google", "/auth/google", "/api/fcm/send",
      "/fcm/send", "/api/login/oauth2/code/kakao", "/login/oauth2/code/kakao",
      "/user/auto-login", "/api/user/auto-login",
      "/api/login/oauth2/code/naver", "/login/oauth2/code/naver", "/api/login/oauth2/code/google",
      "/login/oauth2/code/google", "/app/**", "/api/websocket/info","/api/stock/bulk");
  private final RedisService redisService;
  private final JWTUtil jwtUtil;

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    String method = request.getMethod();
    log.info(path);
    log.info(method);
    if (path.matches("^/api/stock/\\d+$")) {
      return true;  // 이 경로는 JWT 검사를 제외
    }

    if (path.matches("^/api/websocket.*$")) {
      return true; // 이 경로는 JWT 검사를 제외
    }


    // POST 요청인 경우 회원가입은 필터 제외
    if (path.equals("/api/user") && method.equals("POST")) {
      return true;  // 회원가입은 JWT 검증 제외
    }
    if (path.matches("^/api/news/\\d+$")) {
      return true;  // 이 경로는 JWT 검사를 제외
    }
    // /api/uploads/{파일명} 경로는 JWT 검증 제외
    if (path.matches("^/api/uploads/.*$")) {
      return true;  // 이 경로는 JWT 검증 제외
    }
    if (path.matches("^/api/report/\\d+$")) {
      return true;  // 이 경로는 JWT 검사를 제외
    }
//    if (path.matches("^/api/fcm/")) {
//      return true;  // 이 경로는 JWT 검사를 제외
//    }
    return EXCLUDE_PATHS.contains(path);
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    //        log.info("----- JWT 필터에 검증요청이 왔습니다. -----");
    log.info("요청 URL: {}", request.getRequestURL());
    //        log.info("Servlet 경로: {}", request.getServletPath());

    String authorization = request.getHeader("Authorization");
    //        log.info("헤더에서 찾은 Authorization 정보입니다. = {}", authorization);

    try {
      if (authorization != null && authorization.startsWith("Bearer ")) {
        // auth정보가 있고, 토큰 이름이 Bearer로 시작하는 경우
        log.info("Access 토큰 인증을 시작합니다.");
        if (!handleAccessToken(authorization, response)) {
          return; // 토큰 처리 중 오류 발생 시 필터 체인 중단
        }
      } else {
        // auth 정보가 없는 경우
        log.info("유효한 Authorization 헤더가 없습니다.");
        //        return;
      }
      filterChain.doFilter(request, response);
    } catch (JwtException e) {
      log.error("JWT validation error가 발생했습니다.", e);
    }
  }

  private boolean handleAccessToken(String authorization, HttpServletResponse response)
      throws IOException {
    String token = authorization.split(" ")[1];

    try {
      if (redisService.isInBlackList(token)) {
        log.info("탈취당한 JWT 토큰입니다.");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.getWriter().write("AccessTokenForbidden");
        return false;
      }

      if (Boolean.TRUE.equals(jwtUtil.isExpired(token))) {
        log.info("만료된 JWT 토큰입니다.");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write("AccessTokenExpired");
        return false; // 필터 체인 중단
      }
      log.info("유효한 JWT 토큰입니다.");

      // 유저 정보 저장하기
      setAuthenticationToContext(token);
      return true; // 필터 체인 계속 진행

    } catch (Exception e) {
      log.error("JWT 토큰 처리 중 예외 발생", e);
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.getWriter().write("Invalid JWT Token");
      return false; // 필터 체인 중단
    }
  }

  private void setAuthenticationToContext(String token) {
    String email = jwtUtil.getUsername(token);
    String role = jwtUtil.getRole(token);

    User user = User.builder().email(email).role(role).build();

    CustomUserDetails customUserDetails = new CustomUserDetails(user);
    Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null,
        customUserDetails.getAuthorities());
    SecurityContextHolder.getContext().setAuthentication(authToken);
  }
}