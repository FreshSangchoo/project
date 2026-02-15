package com.example.donzoom.config;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private final ConcurrentHashMap<String, AtomicInteger> stockSessionCounts = new ConcurrentHashMap<>();

  @Override
  public void configureMessageBroker(MessageBrokerRegistry config) {
    config.enableSimpleBroker("/topic"); //topic 으로 시작하는 주소는 클라이언트로
    config.setApplicationDestinationPrefixes("/app"); // app 으로 시작하는 주소는 서버로 라우팅
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/websocket")
        .setAllowedOrigins("https://j11a108.p.ssafy.io", "https://localhost:5500",
            "https://127.0.0.1:5500", "http://127.0.0.1:5500",
            "http://localhost:5500", "wss://j11a108.p.ssafy.io:433", "ws://j11a108.p.ssafy.io:8081")  // 여기에 허용할 도메인 추가
        .setAllowedOrigins("*")
        .withSockJS(); // 클라이언트가 웹소켓 연결에 사용할 엔드포인트
    // withSockJs => 소켓 지원하지 않는곳에서도 사용하게금 설정 (우리 프로젝트는 아마 필요 없음)
  }

  // 클라이언트가 특정 주제를 구독했을 때
  @EventListener
  public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
    StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
    String sessionId = headerAccessor.getSessionId();
    String destination = headerAccessor.getDestination(); // 구독 경로 추출

    // "/topic/stock/{stockId}" 형태의 구독 경로에서 stockId 추출
    if (destination != null && destination.startsWith("/topic/stock/")) {
      String stockId = destination.split("/topic/stock/")[1];
      stockSessionCounts.putIfAbsent(stockId, new AtomicInteger(0));
      int currentCount = stockSessionCounts.get(stockId).incrementAndGet();
      log.info("{}에서 웹소켓 구독이 발생했습니다. stockId: {}, 현재 연결 수: {}", sessionId, stockId, currentCount);
    }
  }

  // 클라이언트가 웹소켓에서 연결 해제되었을 때
  @EventListener
  public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
    StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
    String sessionId = headerAccessor.getSessionId();

    // 세션 해제 시 관련된 모든 stockId의 연결을 하나씩 감소
    // 이는 각 sessionId와 stockId 간의 매핑을 유지하지 않기 때문에 간단하게 추적할 수 있는 경우에 사용
    for (String stockId : stockSessionCounts.keySet()) {
      if (stockSessionCounts.containsKey(stockId)) {
        int currentCount = stockSessionCounts.get(stockId).decrementAndGet();
        log.info("{}에서 웹소켓 연결이 해제되었습니다. stockId: {}, 현재 연결 수: {}", sessionId, stockId,
            currentCount);
      }
    }
  }
}

