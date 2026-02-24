package com.apink.poppin.api.chat.service;

import com.apink.poppin.api.chat.dto.ChatMessageDTO;
import com.apink.poppin.api.chat.dto.ChatResponseDTO;
import com.apink.poppin.api.chat.entity.ChatMessage;

import java.util.List;

public interface ChatService {

    ChatResponseDTO insertMessage(ChatMessageDTO chatDto);

    List<ChatMessage> getChatHistory(Long popupId);

}
