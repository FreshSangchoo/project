package com.example.donzoom.controller;

import com.example.donzoom.dto.news.response.NewsResponseDto;
import com.example.donzoom.service.NewsService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/news")
public class NewsController {

  private final NewsService newsService;

  @PostMapping("/{stockId}")
  public ResponseEntity<?> addNews(@PathVariable(name = "stockId") Long stockId,
      @RequestBody List<NewsResponseDto> articles) {
    newsService.createNews(articles, stockId);
    return ResponseEntity.ok().body(articles);
  }

  @GetMapping("/{stockId}/today")
  public ResponseEntity<?> getTodayNewsByStockId(@PathVariable(name = "stockId") Long stockId) {
    ArrayList<NewsResponseDto> newsList = newsService.getTodayNewsByStockId(stockId);
    return ResponseEntity.ok().body(newsList);
  }

  @GetMapping("/{stockId}")
  public ResponseEntity<?> getNewsByStockId(@PathVariable(name = "stockId") Long stockId) {
    ArrayList<NewsResponseDto> newsList = newsService.getNewsByStockId(stockId);
    return ResponseEntity.ok().body(newsList);
  }
}
