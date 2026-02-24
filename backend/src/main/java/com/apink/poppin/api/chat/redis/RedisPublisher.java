package com.apink.poppin.api.chat.redis;

import com.apink.poppin.api.chat.dto.ChatMessageDTO;
import com.apink.poppin.api.chat.dto.ChatResponseDTO;
import com.apink.poppin.api.chat.entity.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class RedisPublisher {

    private final ChannelTopic channelTopic;
    private final RedisTemplate redisTemplate;

    public void publish(ChatResponseDTO chatDto) {
        redisTemplate.convertAndSend(channelTopic.getTopic(), chatDto);
    }


}
