package com.example.donzoom.service;

import com.example.donzoom.constant.LoginMessage;
import com.example.donzoom.dto.user.CustomUserDetails;
import com.example.donzoom.dto.user.request.OauthUserCreateDto;
import com.example.donzoom.dto.user.request.TokenRequestDto;
import com.example.donzoom.dto.user.request.UserCreateDto;
import com.example.donzoom.dto.user.response.LoginResponseDto;
import com.example.donzoom.dto.user.response.UserDetailDto;
import com.example.donzoom.entity.User;
import com.example.donzoom.entity.Wallet;
import com.example.donzoom.exception.DuplicateEmailException;
import com.example.donzoom.repository.UserRepository;
import com.example.donzoom.repository.WalletRepository;
import com.example.donzoom.security.CustomUserDetailsService;
import com.example.donzoom.util.JWTUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

  private final AuthenticationManager authenticationManager;
  private final WalletRepository walletRepository;
  private final UserService userService;
  private final String accessTokenPrefix = "Bearer ";
  private final String refreshTokenPrefix = "refreshToken: ";
  private final String blackListPrefix = "blackList: ";
  private final JWTUtil jwtUtil;
  private final UserRepository userRepository;
  private final OAuth2UserService oAuth2UserService;
  private final RedisService redisService;
  private final CustomUserDetailsService customUserDetailsService;
  @Value("${jwt.accessToken.expireTime}")
  private Long accessExpired;
  @Value("${jwt.refreshToken.expireTime}")
  private Long refreshExpired;

  public LoginResponseDto authUser(String email) {
    User user;
    // 회원가입 처리
    try {
      user = userService.findUserByEmail(email);
    } catch (Exception e) {
      log.info(e.getMessage());
      // 없는 유저(회원가입)
      log.info("존재하지 않는 유저입니다. 회원가입을 진행합니다");
      user = User.builder().email(email).build();
      OauthUserCreateDto userCreateDto = OauthUserCreateDto.builder().email(email).build();
      registOauth2User(userCreateDto);
    }

    //로그인 성공처리
    log.info("로그인 성공 : JWT 토큰 발급");
    String accessToken = jwtUtil.createAccessJwt(user.getEmail(), user.getRole());
    String refreshToken = jwtUtil.createRefreshJwt(user.getEmail(), user.getRole());
    redisService.saveObjectWithTTL(refreshTokenPrefix, refreshToken, refreshExpired);
    return LoginResponseDto.builder().accessToken(accessToken).refreshToken(refreshToken)
        .name(user.getName()).build();
  }

  public Long registOauth2User(OauthUserCreateDto userCreateDto) {
    //이메일 중복체크
    if (userRepository.existsByEmail(userCreateDto.getEmail())) {
      throw new DuplicateEmailException("이미 사용 중인 이메일입니다.");
    }

    // 새로운 지갑 생성
    Wallet wallet = Wallet.builder().build();
    walletRepository.save(wallet);

    User user = User.builder().email(userCreateDto.getEmail()).wallet(wallet).build();

    userRepository.save(user);
    return user.getId();
  }

  public UserDetailDto getUserInfo(HttpServletRequest request) {
    User loginUser = getLoginUser();
    if (loginUser == null) {
      return null;
    }
    // userDetailDto 만들어서 리턴
    return UserDetailDto.builder().id(loginUser.getId()).role(loginUser.getRole())
        .username(loginUser.getName()).email(loginUser.getEmail()).build();

  }

  public Long saveOAuth2User(UserCreateDto userCreateDto) {
    return oAuth2UserService.saveOAuth2User(userCreateDto);
  }

  public void logout(HttpServletRequest request, HttpServletResponse response) {
    String accessToken = extractAccessTokenFromHeader(request);

    if (accessToken == null) {
      log.info("유효한 Access Token이 없습니다.");
      return;
    }

    if (jwtUtil.isExpired(accessToken)) {
      log.info("만료된 Access Token입니다. 다시 로그인해주세요.");
      return;
    }

    // Redis 블랙 리스트에 추가 -> 블랙리스트에 해당 토큰이 있으면 접근할 수 없음
    redisService.saveObjectWithTTL(blackListPrefix + accessToken, true, accessExpired);
    log.info("Access Token '{}'이 블랙리스트에 추가되었습니다.", accessToken);

    // Redis에서 RefreshToken 삭제
    String email = jwtUtil.getUsername(accessToken);
    redisService.deleteObject(refreshTokenPrefix + email);
  }

  public void requestAccess(HttpServletRequest request, HttpServletResponse response) {
    String authorization = extractOAuthAuthorizationFromCookie(request);
    if (authorization == null || jwtUtil.isExpired(authorization)) {
      log.info("토큰이 없습니다. 혹은 만료되었습니다");
      return;
    }

    String email = jwtUtil.getUsername(authorization);
    String role = jwtUtil.getRole(authorization);

    String accessToken = jwtUtil.createAccessJwt(email, role);
    response.addHeader("Authorization", "Bearer " + accessToken);

    String refreshToken = jwtUtil.createRefreshJwt(email, role);
    response.addCookie(createCookie("refreshToken", refreshToken));

    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("해당하는 이메일의 유저가 없습니다"));

    // OAuthAuthorization 쿠키 제거
    removeOAuthAuthorizationCookie(response);
  }

  public User getLoginUser() {
    Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    if (!isLogin(principal)) {
      return null;
    }
    String email = ((CustomUserDetails) principal).getUsername();
    return userRepository.findByEmail(email).orElseThrow(
        () -> new IllegalArgumentException(LoginMessage.WRONG_LOGIN_REQUEST.getValue()));
  }

  private boolean isLogin(Object principal) {
    return principal instanceof CustomUserDetails;
  }

  private String extractAccessTokenFromHeader(HttpServletRequest request) {
    String authorizationHeader = request.getHeader("Authorization");

    if (authorizationHeader != null && authorizationHeader.startsWith(accessTokenPrefix)) {
      return authorizationHeader.substring(accessTokenPrefix.length());
    }

    return null;
  }

  private String extractOAuthAuthorizationFromCookie(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      for (Cookie cookie : cookies) {
        if ("OAuthAuthorization".equals(cookie.getName())) {
          return cookie.getValue();
        }
      }
    }
    return null;
  }

  private void removeOAuthAuthorizationCookie(HttpServletResponse response) {
    Cookie cookie = new Cookie("OAuthAuthorization", null);
    cookie.setMaxAge(0);
    cookie.setPath("/");
    cookie.setHttpOnly(true);
    cookie.setSecure(true);
    response.addCookie(cookie);
  }

  private Cookie createCookie(String key, String value) {
    Cookie cookie = new Cookie(key, value);
    cookie.setMaxAge(60 * 60 * 60);
    cookie.setPath("/");
    cookie.setHttpOnly(true);
    return cookie;
  }

  public Map<String, String> refreshAccessToken(String refreshToken) {
    // 요청 바디에서 받은 Refresh Token 검증

    // 1. Refresh Token 유효성 검증
    if (refreshToken == null || jwtUtil.isExpired(refreshToken)) {
      log.info("만료되었거나 유효하지 않은 Refresh Token입니다.");
      return null; // 재로그인 필요
    }

    // 2. Redis에서 저장된 Refresh Token 확인
    String email = jwtUtil.getUsername(refreshToken);
    String storedRefreshToken = redisService.getObject(refreshTokenPrefix + email, String.class);

    if (!refreshToken.equals(storedRefreshToken)) {
      log.info("Redis에 저장된 Refresh Token이 일치하지 않습니다. 재로그인 필요.");
      return null; // 재로그인 필요


    }

    // 3. 새로운 Access Token 및 Refresh Token 발급
    String role = jwtUtil.getRole(refreshToken);
    String newAccessToken = jwtUtil.createAccessJwt(email, role);
    String newRefreshToken = jwtUtil.createRefreshJwt(email, role);

    // 4. Redis에 새로운 Refresh Token 갱신 (기존 것 삭제 후 재저장)
    log.info(email);

    redisService.deleteObject(refreshTokenPrefix + email);
    redisService.saveObjectWithTTL(refreshTokenPrefix + email, newRefreshToken, refreshExpired);

    log.info("email: {}, role: {}에 해당하는 새로운 Access Token과 Refresh Token을 발급합니다.", email, role);

    // 새로운 Access Token과 Refresh Token 반환
    return Map.of("accessToken", newAccessToken, "refreshToken", newRefreshToken);
  }

  public Map<String, String> autoLogin(String refreshToken) {
    // 1. JWT에서 사용자 정보 추출
    log.info("로그인 요청입니다.");
    String username = jwtUtil.getUsername(refreshToken); // JWT에서 사용자 정보 추출

    // 2. 인증 객체 생성 및 검증
    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(username, null);
    log.info("인증 객체를 생성했습니다.");

    // 4. SecurityContext에 인증 정보 저장
    SecurityContextHolder.getContext().setAuthentication(authToken);
    log.info("SecurityContext에 인증 정보를 설정했습니다.");

    return refreshAccessToken(refreshToken);
  }


}