package com.example.donzoom.dto.news.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NewsResponseDto {

  private final Long newsId;
  private final String title;
  private final String contents;
  private final String source;
  private final LocalDateTime createdAt;

}
