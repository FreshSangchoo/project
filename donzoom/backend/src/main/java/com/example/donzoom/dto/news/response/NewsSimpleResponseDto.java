package com.example.donzoom.dto.news.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NewsSimpleResponseDto {

  private final List<NewsResponseDto> articles;

}
