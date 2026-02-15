package com.example.donzoom.scheduler;

import com.example.donzoom.entity.AutoTransfer;
import com.example.donzoom.repository.AutoTransferRepository;
import com.example.donzoom.service.AccountService;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AutoTransferScheduler {

  private final AutoTransferRepository autoTransferRepository;
  private final AccountService accountService;

  public AutoTransferScheduler(AutoTransferRepository autoTransferRepository,
      AccountService accountService) {
    this.autoTransferRepository = autoTransferRepository;
    this.accountService = accountService;
  }

  @Scheduled(cron = "00 00 09 * * ?") // 매일 오전 9시에 실행
  public void processScheduledTransfers() {
    String today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd"));

    // 오늘 날짜에 맞는 자동이체 조회
    List<AutoTransfer> autoTransfers = autoTransferRepository.findByTransferDate(today);

    for (AutoTransfer transfer : autoTransfers) {
      log.info(transfer.toString());
      // 자동이체 실행
      accountService.executeTransfer(transfer);
    }
  }
}
