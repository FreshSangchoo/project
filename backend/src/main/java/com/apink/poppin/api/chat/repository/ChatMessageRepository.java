package com.apink.poppin.api.chat.repository;

import com.apink.poppin.api.chat.entity.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    List<ChatMessage> findAllByPopupId(Long popupId);

}
