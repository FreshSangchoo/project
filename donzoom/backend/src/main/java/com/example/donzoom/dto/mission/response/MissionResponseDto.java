package com.example.donzoom.dto.mission.response;

import com.example.donzoom.constant.MissionStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MissionResponseDto {

  private Long missionId;
  private String contents;
  private Long reward;
  private MissionStatus status;
  private LocalDateTime dueDate;
  private Integer money;

}
