package com.example.donzoom.dto.user.response;

import com.example.donzoom.entity.AutoTransfer;
import com.example.donzoom.entity.User;
import com.example.donzoom.entity.Wallet;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class UserInfoResponseDto {

  private Long id;
  private String email;
  private String name;
  private String nickname;
  private String profileImage;
  private Boolean isParent;

  private ParentInfoResponseDto parent;
  private List<ChildInfoResponseDto> children;

  private Wallet wallet;
  private Long dailyLimit;             // 1일 결제 한도
  private Long perTransactionLimit;    // 1회 결제 한도
  private Long dailyUsageAmount;  //1일 사용금액

  private List<AutoTransfer> autoTransfers;

  private String accountNo;
}
