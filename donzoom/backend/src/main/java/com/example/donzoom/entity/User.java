package com.example.donzoom.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {


  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY) // PK 자동 생성(생성 전략 = 데이터베이스에 의존)
  @Column(name = "user_id")
  private Long id;

  @NotBlank(message = "이메일은 필수 입력 사항입니다.")
  @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$", message = "유효한 이메일 형식을 입력하세요.")
  @Column(nullable = false, unique = true)
  private String email;

  private String pwdHash;

  private String name;

  private String nickname;

  private String profileImage;

  private String userKey;
  private String role;
  private String provider;

  @ManyToOne(fetch = FetchType.LAZY)
  private User parent;

  @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<User> children;

  private Boolean isParent;

  @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
  @JoinColumn(name = "WALLET_ID")
  @JsonManagedReference
  private Wallet wallet;

  private Long dailyLimit;             // 1일 결제 한도
  private Long perTransactionLimit;    // 1회 결제 한도
  private Long dailyUsageAmount;  //1일 사용금액

  @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
  @JoinColumn(name = "user_id") // 단방향 관계로 JoinColumn 설정
  private List<AutoTransfer> autoTransfers;

  private String accountNo;

  private String paymentPwdHash;

  private String deviceToken;

  @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
  private SavingAccount savingAccount;

  @Builder
  public User(User parent, String email, String pwdHash, String name, String nickname,
      String profileImage, String userKey, Boolean isParent, String role, String provider,
      Wallet wallet, List<AutoTransfer> autoTransfers) {
    this.parent = parent;
    this.email = email;
    this.pwdHash = pwdHash;
    this.name = name;
    this.nickname = nickname;
    this.profileImage = profileImage;
    this.isParent = isParent;
    this.userKey = userKey;
    this.role = role;
    this.provider = provider;
    this.wallet = wallet;
    this.dailyLimit = 0L;
    this.perTransactionLimit = 0L;
    if (autoTransfers != null) {
      this.autoTransfers = autoTransfers;
    }
    this.dailyUsageAmount = 0L;
    this.accountNo = null;
    this.paymentPwdHash = null;
    this.deviceToken = null;
  }


  //=== OAuth2 관련 ===///
  public void oauth2Update(User tempOAuthUser) {
    this.role = tempOAuthUser.getRole();
    this.name = tempOAuthUser.getName();
    this.pwdHash = tempOAuthUser.getPwdHash();
  }

  public void updateUserKey(String userKey) {
    this.userKey = userKey;
  }

  public void updateDeviceToken(String deviceToken) {
    this.deviceToken = deviceToken;
  }

  // 1일결제한도 변경
  public void updateDailyLimit(Long newLimit) {
    this.dailyLimit = newLimit;
  }

  // 1회결제한도 변경
  public void updatePerTransactionLimit(Long newLimit) {
    this.perTransactionLimit = newLimit;
  }

  // 1일결제금액 변경
  public void updateDailyUsageAmount(Long dailyUsageAmount) {
    this.dailyUsageAmount = dailyUsageAmount;
  }

  // 계좌번호 저장
  public void updateAccountNo(String accountNo) {
    this.accountNo = accountNo;
  }

  // 유저 프로필이미지 업데이트
  public void updateProfileImage(String profileImage) {
    this.profileImage = profileImage;
  }
  // 적금계좌 업데이트
  public void updateSavingAccount(SavingAccount savingAccount) {
    this.savingAccount = savingAccount;
  }

  // 유저 추가정보 입력
  public void updateAdditionalInfo(String name, String nickname, String profileImage,
      Boolean isParent) {
    this.name = name;
    this.nickname = nickname;
    this.profileImage = profileImage;
    this.isParent = isParent;
  }

  // 유저 결제 비밀번호 입력
  public void updatePaymentPassword(String hashedPaymentPassword) {
    this.paymentPwdHash = hashedPaymentPassword;
  }
  public void updateParent(User parent){
    this.parent = parent;
  }
  // 내 아이인지 확인
  public Boolean isMyChild(User child) {
    if (this.children.contains(child)) {
      return Boolean.TRUE;
    } else {
      return Boolean.FALSE;
    }
  }

}
