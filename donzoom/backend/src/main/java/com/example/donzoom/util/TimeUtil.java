package com.example.donzoom.util;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.springframework.stereotype.Component;

@Component
public class TimeUtil {

  // 오늘 자정까지 남은 시간을 초 단위로 반환
  public Long getSecondsUntilEndOfDay() {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime endOfDay = now.toLocalDate().atTime(LocalTime.MAX); // 오늘 자정(23:59:59)
    return Duration.between(now, endOfDay).getSeconds();
  }
}
