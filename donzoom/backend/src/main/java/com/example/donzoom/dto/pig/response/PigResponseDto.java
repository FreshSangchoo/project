package com.example.donzoom.dto.pig.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PigResponseDto {

  private final Long pigId;
  private final String imageUrl;
  private final String pigName;
  private final String description;
  private final String createdAt;
}
