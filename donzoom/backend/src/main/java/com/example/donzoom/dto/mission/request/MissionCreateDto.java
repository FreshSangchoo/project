package com.example.donzoom.dto.mission.request;

import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MissionCreateDto {

  private final Long childId;
  private final String contents;
  private final LocalDate dueDate;
  private final Long reward;

}
