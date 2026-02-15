package com.example.donzoom.dto.user.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ParentInfoResponseDto {
  private final Long id;
  private final String email;
  private final String name;
  private final String nickname;
  private final String profileImage;
}
