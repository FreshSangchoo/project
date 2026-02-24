package com.apink.poppin.api.chat.entity;

import com.apink.poppin.api.popup.entity.Popup;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import jakarta.persistence.Id;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Document("chatMessage")
public class ChatMessage {

    @Id
    private String chatId;

    private Long popupId;

    private String sender;
    private String senderImg;

    private String message;

    @CreatedDate
    @Setter
    private LocalTime sendTime;
}
