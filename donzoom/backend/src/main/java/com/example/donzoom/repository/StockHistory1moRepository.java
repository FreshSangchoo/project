package com.example.donzoom.repository;

import com.example.donzoom.entity.StockHistory;
import com.example.donzoom.entity.StockHistory1mo;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockHistory1moRepository extends JpaRepository<StockHistory1mo, Long> {

  // 특정 주식 ID에 대한 가장 최근 기록 조회
  StockHistory findTop1ByStockIdOrderByCreatedAtDesc(Long stockId);

  List<StockHistory1mo> findByStockId(Long stockId);

  boolean existsByStockIdAndCreatedAt(Long stockId, LocalDateTime createdAt);
}
