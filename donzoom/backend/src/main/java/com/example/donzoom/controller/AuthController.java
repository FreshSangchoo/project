package com.example.donzoom.controller;

import com.example.donzoom.dto.user.request.TokenRequestDto;
import com.example.donzoom.dto.user.request.UserCreateDto;
import com.example.donzoom.dto.user.response.LoginResponseDto;
import com.example.donzoom.dto.user.response.UserDetailDto;
import com.example.donzoom.service.AuthService;
import com.example.donzoom.service.UserService;
import com.example.donzoom.util.JWTUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Collections;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;
  private final UserService userService;
  private final JWTUtil jwtUtil;
  private final RestTemplate restTemplate = new RestTemplate();
  private final String accessTokenHeader = "Authorization";
  private final String accessTokenPrefix = "Bearer ";
  private final String refreshTokenPrefix = "refreshToken: ";
  @Value("${google.client.id}")
  private String googleClintId;
  @Value("${spring.security.oauth2.client.provider.naver.user-info-uri}")
  private String naverUserInfoUri;
  @Value("${spring.security.oauth2.client.provider.kakao.user-info-uri}")
  private String kakaoUserInfoUri;

  @PostMapping("/google")
  public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload,
      HttpServletResponse response) {
    log.info("구글 로그인 시도");
    log.info(payload.toString());
    String idTokenString = payload.get("idToken");

    GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(),
        new JacksonFactory()).setAudience(Collections.singletonList(googleClintId)) // 웹 클라이언트 ID 사용
        .build();
    log.info("google verifier 생성");

    try {
      log.info(idTokenString);
      GoogleIdToken idToken = verifier.verify(idTokenString);
      if (idToken != null) {
        log.info(idToken.toString());
        Payload tokenPayload = idToken.getPayload();

        // 사용자 정보 추출
        String email = tokenPayload.getEmail();
        log.info("email" + email);

        // 데이터베이스에서 사용자 존재 여부 확인
        LoginResponseDto loginResponseDto = authService.authUser(email);
        response.setHeader(accessTokenHeader,
            accessTokenPrefix + loginResponseDto.getAccessToken());

        response.setHeader("accessToken", loginResponseDto.getAccessToken());
        return ResponseEntity.ok(loginResponseDto);
      } else {
        log.info("INVALID ID TOKEN");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid ID token");
      }
    } catch (Exception e) {
      log.info(e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Token verification failed");
    }
  }

  @PostMapping("/naver")
  public ResponseEntity<?> naverLogin(@RequestBody Map<String, String> payload,
      HttpServletResponse response) {
    String accessToken = payload.get("accessToken");

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);

    HttpEntity<String> requestEntity = new HttpEntity<>(headers);
    ResponseEntity<String> responseEntity = restTemplate.exchange(naverUserInfoUri, HttpMethod.GET,
        requestEntity, String.class);

    try {
      ObjectMapper objectMapper = new ObjectMapper();
      JsonNode responseNode = objectMapper.readTree(responseEntity.getBody()).path("response");

      if (responseNode.isMissingNode()) {
        return ResponseEntity.status(401).body("네이버 사용자 정보 조회 실패");
      }

      String email = responseNode.path("email").asText();
      log.info("email" + email);

      // 데이터베이스에서 사용자 존재 여부 확인
      LoginResponseDto loginResponseDto = authService.authUser(email);
      response.setHeader(accessTokenHeader, accessTokenPrefix + loginResponseDto.getAccessToken());

      response.setHeader("accessToken", loginResponseDto.getAccessToken());
      return ResponseEntity.ok(loginResponseDto);
    } catch (Exception e) {
      log.error("네이버 로그인 실패", e);
      return ResponseEntity.status(500).body("네이버 로그인 처리 중 오류 발생");
    }
  }

  @PostMapping("/kakao")
  public ResponseEntity<?> kakaoLogin(@RequestBody Map<String, String> payload,
      HttpServletResponse response) {
    String accessToken = payload.get("accessToken");

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);

    HttpEntity<String> requestEntity = new HttpEntity<>(headers);
    ResponseEntity<String> responseEntity = restTemplate.exchange(kakaoUserInfoUri, HttpMethod.GET,
        requestEntity, String.class);

    try {
      ObjectMapper objectMapper = new ObjectMapper();
      JsonNode responseNode = objectMapper.readTree(responseEntity.getBody());

      String email = responseNode.path("kakao_account").path("email").asText();
      log.info("email" + email);

      // 데이터베이스에서 사용자 존재 여부 확인
      LoginResponseDto loginResponseDto = authService.authUser(email);
      response.setHeader(accessTokenHeader, accessTokenPrefix + loginResponseDto.getAccessToken());

      // Refresh Token을 바디에 설정
      response.setHeader("accessToken", loginResponseDto.getAccessToken());
      return ResponseEntity.ok(loginResponseDto);
    } catch (Exception e) {
      log.error("카카오 로그인 실패", e);
      return ResponseEntity.status(500).body("카카오 로그인 처리 중 오류 발생");
    }
  }

  @GetMapping("/userInfo")
  public ResponseEntity<?> getUserInfo(HttpServletRequest request) {
    UserDetailDto userDetailDto = authService.getUserInfo(request);
    if (userDetailDto != null) {
      return new ResponseEntity<>(userDetailDto, HttpStatus.OK);
    }
    return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
  }

  @PostMapping("/users")
  public ResponseEntity<?> register(@RequestBody UserCreateDto userCreateDto) {
    Long saveId = authService.saveOAuth2User(userCreateDto);
    return new ResponseEntity<>(saveId, HttpStatus.OK);
  }

  @PostMapping("/refresh")
  public ResponseEntity<?> refreshAccessToken(HttpServletResponse response,
      @RequestBody TokenRequestDto tokenRequestDto) {
    // 클라이언트가 바디로 보내준 Refresh Token을 추출
    String refreshToken = tokenRequestDto.getRefreshToken();

    if (refreshToken == null) {
      return new ResponseEntity<>("Refresh token이 없습니다.", HttpStatus.UNAUTHORIZED);
    }

    // Redis에서 Refresh Token 검증 및 Access Token 발급 처리
    Map<String, String> tokens = authService.refreshAccessToken(refreshToken);

    if (tokens.get("refreshToken") == null) {
      return new ResponseEntity<>("Invalid or expired refresh token. 재로그인 필요.",
          HttpStatus.UNAUTHORIZED);
    }

    // Access Token과 Refresh Token을 함께 응답
    String newAccessToken = tokens.get("accessToken");
    String newRefreshToken = tokens.get("refreshToken");

    // 응답 헤더에 새로운 Access Token을 추가
    response.setHeader("Authorization", "Bearer " + newAccessToken);

    // 응답 바디에 새로운 Refresh Token을 반환
    return ResponseEntity.ok().body(Map.of("refreshToken", newRefreshToken));
  }


  @GetMapping("/logout")
  public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
    authService.logout(request, response);
    return new ResponseEntity<>(HttpStatus.OK);
  }

  @GetMapping("/token")
  public ResponseEntity<?> requestAccess(HttpServletRequest request, HttpServletResponse response) {
    authService.requestAccess(request, response);
    return new ResponseEntity<>(HttpStatus.OK);
  }


}