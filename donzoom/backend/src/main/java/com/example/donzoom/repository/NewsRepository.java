package com.example.donzoom.repository;

import com.example.donzoom.entity.News;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsRepository extends JpaRepository<News, Long> {

  List<News> findTop3ByStockIdOrderByCreatedAtDesc(Long stockId);

  // 특정 stockId와 오늘 날짜에 해당하는 뉴스 가져오기
  List<News> findByStockIdAndCreatedAtBetween(Long stockId, LocalDateTime startDateTime,
      LocalDateTime endDateTime);

  // 특정 stockId의 뉴스들을 최신순으로 정렬하여 가져오기
  List<News> findByStockIdOrderByCreatedAtDesc(Long stockId);
}
