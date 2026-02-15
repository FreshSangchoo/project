package com.example.donzoom.service;

import com.example.donzoom.dto.news.response.NewsResponseDto;
import com.example.donzoom.entity.News;
import com.example.donzoom.entity.Stock;
import com.example.donzoom.repository.NewsRepository;
import com.example.donzoom.repository.StockRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NewsService {

  private final NewsRepository newsRepository;
  private final StockRepository stockRepository;

  public void createNews(List<NewsResponseDto> articles, Long stockId) {
    List<News> newsList = new ArrayList<>();

    for (NewsResponseDto newsDto : articles) {
      // 주어진 stockId로 Stock 엔티티를 조회
      Stock stock = stockRepository.findById(stockId)
          .orElseThrow(() -> new RuntimeException("Stock not found for ID: " + stockId));
      // News 엔티티 생성
      News news = News.builder().stock(stock).title(newsDto.getTitle())
          .contents(newsDto.getContents()).createdAt(newsDto.getCreatedAt())
          .source(newsDto.getSource()).build();
      // 생성된 News 엔티티를 리스트에 추가
      newsList.add(news);
    }

    // News 엔티티 일괄 저장
    newsRepository.saveAll(newsList);
  }

  // 오늘 날짜의 뉴스만 가져오기
  public ArrayList<NewsResponseDto> getTodayNewsByStockId(Long stockId) {
    LocalDate today = LocalDate.now(); // 오늘 날짜 가져오기

    // 오늘 날짜의 뉴스만 가져오기
    List<News> todayNewsList = newsRepository.findByStockIdAndCreatedAtBetween(stockId,
        today.atStartOfDay(), today.plusDays(1).atStartOfDay()  // 내일 시작 전까지
    );

    return todayNewsList.stream().map(
        news -> NewsResponseDto.builder().newsId(news.getId()).title(news.getTitle())
            .contents(news.getContents()).source(news.getSource())
            .createdAt(news.getCreatedAt())  // LocalDateTime을 String으로 변환
            .build()).collect(Collectors.toCollection(ArrayList::new));
  }

  // 전체 뉴스 최신순으로 가져오기
  public ArrayList<NewsResponseDto> getNewsByStockId(Long stockId) {
    List<News> newsList = newsRepository.findByStockIdOrderByCreatedAtDesc(stockId);

    return newsList.stream().map(
        news -> NewsResponseDto.builder().newsId(news.getId()).title(news.getTitle())
            .contents(news.getContents()).source(news.getSource())
            .createdAt(news.getCreatedAt())  // LocalDateTime을 String으로 변환
            .build()).collect(Collectors.toCollection(ArrayList::new));
  }

}
