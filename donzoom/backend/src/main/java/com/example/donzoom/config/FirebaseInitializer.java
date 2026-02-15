package com.example.donzoom.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;


@Slf4j
@Component
public class FirebaseInitializer {

  @PostConstruct
  public void initialize() {
    try {
      // 이미 초기화된 FirebaseApp이 있는지 확인
      List<FirebaseApp> firebaseApps = FirebaseApp.getApps();
      if (firebaseApps.isEmpty()) {
        InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("firebase-service-account.json");

        FirebaseOptions options = FirebaseOptions.builder()
            .setCredentials(GoogleCredentials.fromStream(serviceAccount)).build();

        FirebaseApp.initializeApp(options);
        log.info("Firebase 초기화 완료");
      } else {
        log.info("Firebase는 이미 초기화되었습니다.");
      }
    } catch (IOException e) {
      log.error("Firebase 초기화 중 오류 발생: " + e.getMessage());
    }
  }
}
