package com.example.donzoom.scheduler;

import com.example.donzoom.entity.User;
import com.example.donzoom.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DailyUsageResetScheduler {

  private final UserRepository userRepository;

  @Scheduled(cron = "0 0 0 * * ?")  // 매일 자정에 실행
  @Transactional
  public void resetDailyUsageAmount() {
    List<User> users = userRepository.findAll();
    for (User user : users) {
      user.updateDailyUsageAmount(0L);  // 1일 사용 금액 초기화
      userRepository.save(user);  // 변경 사항 저장
    }
  }
}
