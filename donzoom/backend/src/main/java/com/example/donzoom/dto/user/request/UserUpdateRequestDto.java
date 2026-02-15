package com.example.donzoom.dto.user.request;

import com.example.donzoom.entity.AutoTransfer;
import com.example.donzoom.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class UserUpdateRequestDto {

  private String pwdHash;

  private String name;

  private String nickname;

  private String profileImage;

  private Boolean isParent;

  private String userKey;
  private String role;
  private String provider;

  @ManyToOne(fetch = FetchType.LAZY)
  private User parent;

  @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<User> children;

  private Long dailyLimit;             // 1일 결제 한도
  private Long perTransactionLimit;    // 1회 결제 한도
  private Long dailyUsageAmount;  //1일 사용금액

  @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
  @JoinColumn(name = "user_id") // 단방향 관계로 JoinColumn 설정
  private List<AutoTransfer> autoTransfers;

  private String accountNo;
}
