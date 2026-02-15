package com.example.donzoom.dto.mission.request;

import com.example.donzoom.constant.MissionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MissionUpdateRequestDto {

  private final String contents;
  private final String dueDate;
  private final Long reward;
  private final MissionStatus status;

}
