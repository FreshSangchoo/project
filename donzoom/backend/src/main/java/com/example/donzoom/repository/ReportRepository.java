package com.example.donzoom.repository;

import com.example.donzoom.entity.Report;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

  // 특정 stockId로 리포트를 최신순으로 조회
  List<Report> findByStockIdOrderByCreatedAtDesc(Long stockId);

  // 특정 stockId로 오늘 날짜의 리포트를 조회
  List<Report> findByStockIdAndCreatedAtBetween(Long stockId, LocalDateTime startDate,
      LocalDateTime endDate);
}
