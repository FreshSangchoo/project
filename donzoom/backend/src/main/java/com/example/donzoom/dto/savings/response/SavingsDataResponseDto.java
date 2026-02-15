package com.example.donzoom.dto.savings.response;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SavingsDataResponseDto {
  private boolean exists;
  private String status; // "만기 해지 가능", "중도 해지 가능", "적금 없음"
  private boolean canTerminate;
}
