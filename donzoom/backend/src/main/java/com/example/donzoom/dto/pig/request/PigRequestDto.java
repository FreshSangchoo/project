package com.example.donzoom.dto.pig.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PigRequestDto {

  private Integer amount; // 요청할 Pig의 개수
}