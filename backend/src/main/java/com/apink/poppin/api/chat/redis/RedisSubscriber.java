package com.apink.poppin.api.chat.redis;

import com.apink.poppin.api.chat.dto.ChatMessageDTO;
import com.apink.poppin.api.chat.dto.ChatResponseDTO;
import com.apink.poppin.api.chat.entity.ChatMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Slf4j
@Service
public class RedisSubscriber {

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate template;

    // Redis에서 메시지가 발행(publish) 되면 대기하고있던 RedisSubscriber가 해당 메시지를 받아서 처리
    public void insertMessage(String publishMessage) {
        try {
            ChatResponseDTO chatResponseDto =
                    objectMapper.readValue(publishMessage, ChatResponseDTO.class);

            log.info("Redis Subscriber message : {}",chatResponseDto.getMessage());

            // 채팅방을 구독한 클라이언트에게 메시지 발송
            template.convertAndSend("/sub/popup/"+chatResponseDto.getPopupId(), chatResponseDto);
        } catch (Exception e) {
            log.error("Exception {}", e);
        }
    }


}
