package com.example.donzoom.dto.user.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class UserDetailDto {

  private Long id;
  private String role;
  private String email;
  private String username;
  private LocalDateTime deletedAt;

}

