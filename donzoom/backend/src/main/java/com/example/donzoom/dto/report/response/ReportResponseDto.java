package com.example.donzoom.dto.report.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReportResponseDto {

  private final Long reportId;
  private final String title;
  private final String contents;
  private final LocalDateTime createdAt;
  private final String source;

}
