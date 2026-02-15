package com.example.donzoom.service;

import com.example.donzoom.dto.report.response.ReportResponseDto;
import com.example.donzoom.entity.Report;
import com.example.donzoom.entity.Stock;
import com.example.donzoom.repository.ReportRepository;
import com.example.donzoom.repository.StockRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

  private final ReportRepository reportRepository;
  private final StockRepository stockRepository;

  public void createReport(List<ReportResponseDto> reports, Long stockId) {
    List<Report> newsList = new ArrayList<>();

    for (ReportResponseDto reportDto : reports) {
      // 주어진 stockId로 Stock 엔티티를 조회
      Stock stock = stockRepository.findById(stockId)
          .orElseThrow(() -> new RuntimeException("Stock not found for ID: " + stockId));
      // News 엔티티 생성
      log.info(reportDto.getCreatedAt() + "리포트 생성시간");
      Report report = Report.builder().stock(stock).title(reportDto.getTitle())
          .contents(reportDto.getContents()).createdAt(reportDto.getCreatedAt())
          .source(reportDto.getSource()).build();
      // 생성된 News 엔티티를 리스트에 추가
      newsList.add(report);
    }

    // News 엔티티 일괄 저장
    reportRepository.saveAll(newsList);
  }

  // 특정 주식의 리포트 최신순으로 가져오기
  public ArrayList<ReportResponseDto> getReportsByStockId(Long stockId) {
    List<Report> reportList = reportRepository.findByStockIdOrderByCreatedAtDesc(stockId);

    // ReportResponseDto로 변환 (빌더 패턴 사용)
    return reportList.stream().map(
        report -> ReportResponseDto.builder().reportId(report.getId()).title(report.getTitle())
            .contents(report.getContents()).createdAt(report.getCreatedAt())
            .source(report.getSource()).build()).collect(Collectors.toCollection(ArrayList::new));
  }

  // 오늘 날짜의 리포트만 가져오기
  public ArrayList<ReportResponseDto> getTodayReportsByStockId(Long stockId) {
    LocalDate today = LocalDate.now(); // 오늘 날짜 가져오기

    // 오늘 날짜의 리포트만 가져오기
    List<Report> todayReportList = reportRepository.findByStockIdAndCreatedAtBetween(stockId,
        today.atStartOfDay(), today.plusDays(1).atStartOfDay()  // 내일 시작 전까지
    );

    // ReportResponseDto로 변환 (빌더 패턴 사용)
    return todayReportList.stream().map(
        report -> ReportResponseDto.builder().reportId(report.getId()).title(report.getTitle())
            .contents(report.getContents()).createdAt(report.getCreatedAt())
            .source(report.getSource()).build()).collect(Collectors.toCollection(ArrayList::new));
  }
}
