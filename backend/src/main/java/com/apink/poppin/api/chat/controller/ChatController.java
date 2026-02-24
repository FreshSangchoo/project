package com.apink.poppin.api.chat.controller;

import com.apink.poppin.api.chat.dto.ChatMessageDTO;
import com.apink.poppin.api.chat.dto.ChatResponseDTO;
import com.apink.poppin.api.chat.entity.ChatMessage;
import com.apink.poppin.api.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate template;

    @MessageMapping("/message")
    public ChatResponseDTO message(ChatMessageDTO chatDTO) {
        ChatResponseDTO chat = chatService.insertMessage(chatDTO);
        log.info("chat = {}", chat);
//        chatService.sendMessage(chat); //RedisPublisher 호출
//        template.convertAndSend("/sub/room/" + roomId, chatDTO);
        System.out.println("message = "+ chatDTO.getMessage());
        System.out.println("message = "+ chat.getMessage());

        return chat;
    }


}
