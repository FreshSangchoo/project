package com.example.donzoom.service;

import com.example.donzoom.dto.user.CustomUserDetails;
import com.example.donzoom.dto.user.request.LoginRequestDto;
import com.example.donzoom.dto.user.request.UserCreateDto;
import com.example.donzoom.dto.user.request.UserUpdateRequestDto;
import com.example.donzoom.dto.user.response.LoginResponseDto;
import com.example.donzoom.dto.user.response.ParentInfoResponseDto;
import com.example.donzoom.dto.user.response.UserInfoResponseDto;
import com.example.donzoom.entity.Pending;
import com.example.donzoom.entity.User;
import com.example.donzoom.entity.Wallet;
import com.example.donzoom.exception.DuplicateEmailException;
import com.example.donzoom.repository.PendingRepository;
import com.example.donzoom.repository.UserRepository;
import com.example.donzoom.repository.WalletRepository;
import com.example.donzoom.util.FileUploadUtil;
import com.example.donzoom.util.JWTUtil;
import com.example.donzoom.util.SecurityUtil;
import com.google.firebase.messaging.FirebaseMessagingException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

  private final FCMService fcmService;
  private final AuthenticationManager authenticationManager;
  private final PasswordService passwordService;
  private final UserRepository userRepository;
  private final WalletRepository walletRepository;
  private final JWTUtil jwtUtil;
  private final FileUploadUtil fileUploadUtil;
  private final PendingRepository pendingRepository;

  public Long registerUser(UserCreateDto userCreateDto) {

    //이메일 중복체크
    if (userRepository.existsByEmail(userCreateDto.getEmail())) {
      throw new DuplicateEmailException("이미 사용 중인 이메일입니다.");
    }

    // 새로운 지갑 생성
    Wallet wallet = Wallet.builder().build();
    walletRepository.save(wallet);

    log.info(userCreateDto.getIsParent().toString());
    User user = User.builder().email(userCreateDto.getEmail())
        .pwdHash(passwordService.encode(userCreateDto.getPassword())).name(userCreateDto.getName())
            .isParent(userCreateDto.getIsParent())
        .nickname(userCreateDto.getNickname()).wallet(wallet).build();

    log.info(user.getIsParent().toString());
    userRepository.save(user);

    Wallet myWallet = user.getWallet();

    myWallet.updateUser(user);

    walletRepository.save(wallet);

    return user.getId();
  }

  public LoginResponseDto login(LoginRequestDto loginRequestDto) {
    log.info(loginRequestDto.getEmail());
    log.info(loginRequestDto.getPassword());
    log.info("로그인 요청입니다.");
    // 인증 객체 생성 및 검증
    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
        loginRequestDto.getEmail(), loginRequestDto.getPassword());
    log.info("인증 객체를 생성했습니다.");
    Authentication authentication = authenticationManager.authenticate(authToken);
    log.info("인증 과정을 완료했습니다.");
    CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
    log.info("커스텀 디테일을 생성했습니다.");

    // 4. SecurityContext에 인증 정보 저장
    SecurityContextHolder.getContext().setAuthentication(authentication);
    log.info("SecurityContext에 인증 정보를 설정했습니다.");

    String email = customUserDetails.getUsername();
    String role = customUserDetails.getAuthorities().iterator().next().getAuthority();

    // Jwt토큰이 발급 전이라 이렇게 찾아와야함
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("로그인된 유저를 찾을 수 없습니다."));
    user.updateDeviceToken(loginRequestDto.getDeviceToken());
    userRepository.save(user);
    log.info("토큰 발급 전입니다.");
    // AccessToken 발급
    String accessToken = jwtUtil.createAccessJwt(email, role);

    //RefreshToken 발급 및 저장
    String refreshToken = jwtUtil.createRefreshJwt(email, role);
    log.info("토큰 발급 후입니다.");
    return LoginResponseDto.builder().accessToken(accessToken).refreshToken(refreshToken)
        .name(user.getName()).build();
  }

  public void updateUser(MultipartFile file, UserUpdateRequestDto userUpdateRequestDto)
      throws Exception {
    User user = findCurrentUser();
    // 파일을 로컬/서버에 저장
    String fileUri = fileUploadUtil.saveFile(file);

    // 프로필 이미지 경로를 DB에 업데이트
    user.updateAdditionalInfo(userUpdateRequestDto.getName(), userUpdateRequestDto.getNickname(),
        fileUri, userUpdateRequestDto.getIsParent());
    userRepository.save(user);
  }

  public String updateUser(MultipartFile file)
          throws Exception {
    User user = findCurrentUser();
    // 파일을 로컬/서버에 저장
    String fileUri = fileUploadUtil.saveFile(file);

    // 프로필 이미지 경로를 DB에 업데이트
    user.updateProfileImage(fileUri);
    userRepository.save(user);
    return fileUri;
  }

  public User findCurrentUser() {
    String username = SecurityUtil.getAuthenticatedUsername();
    return userRepository.findByEmail(username)
        .orElseThrow(() -> new IllegalArgumentException("현재 로그인 된 유저를 찾을 수 없습니다."));
  }

  public User findUserById(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("해당 아이디의 유저를 찾을 수 없습니다."));
  }

  public User findUserByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("해당 이메일의 유저를 찾을 수 없습니다."));
  }

  public User findUserByAccountNo(String accountNo) {
    return userRepository.findByAccountNo(accountNo)
        .orElseThrow(() -> new IllegalArgumentException("해당 계좌번호의 유저를 찾을 수 없습니다."));
  }

  public User findUserByDeviceToken(String token){
    return userRepository.findByDeviceToken(token).orElseThrow(()-> new IllegalArgumentException("해당 토큰의 유저를 찾을 수 없습니다."));
  }

  public void updatePaymentPassword(String paymentPassword) {
    User user = findCurrentUser();
    user.updatePaymentPassword(paymentPassword);
    userRepository.save(user);
  }
  public String addChild(String childEmail) {
    // 현재 인증된 사용자 정보 가져오기(부모)
    String username = SecurityUtil.getAuthenticatedUsername();
    User parent = userRepository.findByEmail(username)
        .orElseThrow(() -> new RuntimeException("User not found"));

    // Pending 테이블에서 아이의 이메일에 해당하는 레코드가 있는지 확인
    Optional<Pending> pendingRecord = pendingRepository.findByChildEmail(childEmail);

    if (pendingRecord.isEmpty()) {
      // Pending 테이블에 새로운 레코드 추가
      Pending newPending = Pending.builder()
          .childEmail(childEmail)
          .parentId(parent.getId().toString())
          .build();
      pendingRepository.save(newPending);
      return "아이 등록 요청이 대기 중입니다: " + childEmail;
    } else {
      return "이미 등록 대기 중인 아이입니다: " + childEmail;
    }
  }



  public Object getParentInfo() {
    // 현재 인증된 사용자 정보 가져오기(아이)
    String username = SecurityUtil.getAuthenticatedUsername();
    User child = userRepository.findByEmail(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
    log.info(child.getEmail()+"Eeeeeee");
    Optional<Pending> pendingRecord = pendingRepository.findByChildEmail(child.getEmail());

    if (pendingRecord.isPresent()) {
      Long parentId = Long.parseLong(pendingRecord.get().getParentId());
      User parent = userRepository.findById(parentId)
          .orElseThrow(() -> new RuntimeException("Parent not found"));

      return ParentInfoResponseDto.builder()
          .id(parent.getId())
          .email(parent.getEmail())
          .name(parent.getName())
          .nickname(parent.getNickname())
          .profileImage(parent.getProfileImage())
          .build();
    }

    return "저장된 부모 정보가 없습니다.";
  }


  public void setParentChildRelationship2() {
    // 현재 로그인한 사용자(아이) 정보 가져오기
    String username = SecurityUtil.getAuthenticatedUsername();
    User child = userRepository.findByEmail(username)
        .orElseThrow(() -> new RuntimeException("User not found"));

    // Pending 테이블에서 아이의 이메일에 해당하는 레코드 찾기
    Optional<Pending> pendingRecord = pendingRepository.findByChildEmail(child.getEmail());

    if (pendingRecord.isPresent()) {
      // 부모 ID로 부모 사용자 조회
      Long parentId = Long.parseLong(pendingRecord.get().getParentId());
      User parent = userRepository.findById(parentId)
          .orElseThrow(() -> new RuntimeException("Parent not found"));

      // 양방향 연관관계 설정
      child.updateParent(parent);
      parent.getChildren().add(child);

      // 관계 저장
      userRepository.save(child);

      // Pending 테이블에서 해당 레코드 삭제
      pendingRepository.delete(pendingRecord.get());

      try {
        fcmService.sendNotification(parent, "아이 등록", "내 아이로 등록이 완료되었습니다.");
      } catch (FirebaseMessagingException e) {
        throw new RuntimeException("연결이 실패되었습니다.");
      }

    } else {
      throw new RuntimeException("Pending record not found for the user.");
    }
  }

  @Transactional(readOnly = true)
  public Object getParent() {
    // 현재 인증된 사용자 정보 가져오기
    String username = SecurityUtil.getAuthenticatedUsername();
    User user = userRepository.findByEmail(username)
        .orElseThrow(() -> new RuntimeException("User not found"));

    // 부모 ID가 null인지 체크
    if (user.getParent() == null) {
      return false; // 부모가 없으면 false 반환
    } else {
      // 부모 정보 가져오기
      User parent = user.getParent();
      // ParentInfoResponseDto로 부모 정보 반환
      ParentInfoResponseDto parentInfo = ParentInfoResponseDto.builder()
          .id(parent.getId())
          .name(parent.getName())
          .email(parent.getEmail())
          .nickname(parent.getNickname())
          .name(parent.getName())
          .profileImage(parent.getProfileImage())
          .build();
      return parentInfo;
    }
  }
}
