package com.example.donzoom.controller;

import com.example.donzoom.dto.user.request.ChildRequest;
import com.example.donzoom.dto.user.request.LoginRequestDto;
import com.example.donzoom.dto.user.request.TokenRequestDto;
import com.example.donzoom.dto.user.request.UserCreateDto;
import com.example.donzoom.dto.user.request.UserUpdateRequestDto;
import com.example.donzoom.dto.user.response.ChildInfoResponseDto;
import com.example.donzoom.dto.user.response.LoginResponseDto;
import com.example.donzoom.dto.user.response.ParentInfoResponseDto;
import com.example.donzoom.dto.user.response.UserInfoResponseDto;
import com.example.donzoom.entity.User;
import com.example.donzoom.exception.DuplicateEmailException;
import com.example.donzoom.repository.UserRepository;
import com.example.donzoom.service.AuthService;
import com.example.donzoom.service.RedisService;
import com.example.donzoom.service.UserService;
import com.example.donzoom.util.FileUploadUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
@Slf4j
public class UserController {

  private final String accessTokenHeader = "Authorization";
  private final String accessTokenPrefix = "Bearer ";
  private final String refreshTokenPrefix = "refreshToken: ";
  private final UserRepository userRepository;
  private final FileUploadUtil fileUploadUtil;

  @Value("${jwt.refreshToken.expireTime}")
  private Long refreshExpired;

  private final UserService userService;
  private final RedisService redisService;
  private final AuthService authService;

  @GetMapping
  public ResponseEntity<?> getCurrentUserInfo(){
    User loginUser = userService.findCurrentUser();
    List<ChildInfoResponseDto> childrenDtos = loginUser.getChildren().stream()
        .map(child -> ChildInfoResponseDto.builder()
            .id(child.getId())
            .email(child.getEmail())
            .name(child.getName())
            .nickname(child.getNickname())
            .build())
        .collect(Collectors.toList());

    UserInfoResponseDto userInfoResponseDto = UserInfoResponseDto.builder()
        .id(loginUser.getId())
        .email(loginUser.getEmail())
        .name(loginUser.getName())
        .nickname(loginUser.getNickname())
        .isParent(loginUser.getIsParent())
        .profileImage(loginUser.getProfileImage())
        .children(childrenDtos)
        .build();
    return ResponseEntity.ok(userInfoResponseDto);
  }

  @PostMapping
  public ResponseEntity<?> register(@RequestBody @Valid UserCreateDto userCreateDto,
      BindingResult bindingResult) {
    log.info(userCreateDto.toString());
    // 입력 데이터 유효성 검증
    if (bindingResult.hasErrors()) {
      StringBuilder errors = new StringBuilder();
      bindingResult.getFieldErrors().forEach(error -> {
        errors.append(error.getDefaultMessage()).append(" ");
      });
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors.toString().trim());
    }

    try {
      Long id = userService.registerUser(userCreateDto);
      return new ResponseEntity<>("회원가입 성공", HttpStatus.CREATED);
    } catch (DuplicateEmailException e) {
      return new ResponseEntity<>("이미 가입된 회원입니다", HttpStatus.CONFLICT);
    } catch (Exception e) {
      return new ResponseEntity<>("회원가입 중 오류 발생", HttpStatus.BAD_REQUEST);
    }
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequestDto loginRequestDto,
      HttpServletResponse response) {
    try {
      // 로그인 시도
      LoginResponseDto loginResponseDto = userService.login(loginRequestDto);

      // Access Token을 헤더에 설정
      response.setHeader(accessTokenHeader, accessTokenPrefix + loginResponseDto.getAccessToken());

      // Refresh Token을 바디에 설정
      Map<String, String> refreshToken = Map.of("refreshToken", loginResponseDto.getRefreshToken());

      // Redis에 사용자의 RefreshToken을 저장
      redisService.saveObjectWithTTL(refreshTokenPrefix + loginRequestDto.getEmail(),
          loginResponseDto.getRefreshToken(), refreshExpired);

      return ResponseEntity.ok(loginResponseDto);
    } catch (AuthenticationException e) {
      return new ResponseEntity<>("유효하지 않은 이메일과 비밀번호입니다.", HttpStatus.UNAUTHORIZED);
    } catch (Exception e) {
      log.info(e.getMessage());
      return new ResponseEntity<>("로그인 중 서버 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @DeleteMapping("/logout")
  public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {

    // 로그아웃
    authService.logout(request, response);

    // 응답 상태 200 OK 반환
    return new ResponseEntity<>(HttpStatus.OK);
  }

  @PostMapping("/update")
  public ResponseEntity<?> update(@RequestPart("file") MultipartFile file,
      @ModelAttribute UserUpdateRequestDto userUpdateRequestDto) {
    log.info("GET : /api/user/update");
    try {
      userService.updateUser(file, userUpdateRequestDto);
    }catch(Exception e) {
      log.error(e.getMessage());
    }
    return ResponseEntity.ok().build();
  }

  @PostMapping("/child-add")
  public ResponseEntity<?> addChild(@RequestBody ChildRequest request) {
    List<String> childEmails = request.getChildEmails();
    List<String> results = new ArrayList<>();

    for (String childEmail : childEmails) {
      String result = userService.addChild(childEmail);
      results.add(result);
    }

    return ResponseEntity.ok(results);
  }


  @GetMapping("/parent-info")
  public ResponseEntity<?> getParentInfo() {
    Object response = userService.getParentInfo();
    if (response instanceof ParentInfoResponseDto) {
      return ResponseEntity.ok(response);
    } else if (response instanceof String) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("알 수 없는 오류가 발생했습니다.");
  }

  //아이 로그인 상태에서 부모와 연관관계설정.
  @PostMapping("/set-relationship")
  public ResponseEntity<?> setParentChildRelationship() {
    userService.setParentChildRelationship2();
    return ResponseEntity.ok("부모-아이 관계가 설정되었습니다.");
  }

  @PostMapping("/auto-login")
  public ResponseEntity<?> autoLogin(@RequestBody TokenRequestDto tokenRequestDto, HttpServletResponse response) {

    // 1. RefreshToken 검증
    String token = tokenRequestDto.getRefreshToken();
    log.info("token : {}", token);

    // 자동 로그인(Security Context)
    Map<String, String> tokenMap = authService.autoLogin(token);

    // Access Token을 헤더에 설정
    response.setHeader(accessTokenHeader, accessTokenPrefix + tokenMap.get("accessToken"));

    return ResponseEntity.ok(tokenMap);
  }

  @PostMapping("/profileImage")
  public ResponseEntity<?> updateImage(@RequestParam("file") MultipartFile file) {
    try {
      if (file == null || file.isEmpty()) {
        return new ResponseEntity<>("파일이 존재하지 않습니다.", HttpStatus.BAD_REQUEST);
      }
      String imageUrl = userService.updateUser(file);

      return new ResponseEntity<>(imageUrl, HttpStatus.OK);
    } catch (Exception e) {
      return new ResponseEntity<>("이미지 업로드 중 오류 발생", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @GetMapping("/exist-parent")
  public ResponseEntity<?> getParent() {
    Object response = userService.getParent();
    if (response instanceof ParentInfoResponseDto) {
      return ResponseEntity.ok(response);
    } else if (response instanceof Boolean && !(Boolean) response) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Boolean.FALSE);
    }
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("알 수 없는 오류가 발생했습니다.");
  }

}
