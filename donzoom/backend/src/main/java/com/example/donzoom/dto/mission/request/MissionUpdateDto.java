package com.example.donzoom.dto.mission.request;

import com.example.donzoom.constant.MissionStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MissionUpdateDto {

  private final String contents;
  private final LocalDateTime dueDate;
  private final Long reward;
  private final MissionStatus status;

}
