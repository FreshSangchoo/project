package com.apink.poppin.api.chat.service;

import com.apink.poppin.api.chat.dto.ChatMessageDTO;
import com.apink.poppin.api.chat.dto.ChatResponseDTO;
import com.apink.poppin.api.chat.entity.ChatMessage;
import com.apink.poppin.api.chat.redis.RedisPublisher;
import com.apink.poppin.api.chat.repository.ChatMessageRepository;
import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.popup.repository.PopupRepository;
import com.apink.poppin.api.user.entity.User;
import com.apink.poppin.api.user.repository.UserRepository;
import com.apink.poppin.common.exception.dto.BusinessLogicException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static com.apink.poppin.common.exception.dto.ExceptionCode.USER_NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatRepository;
    private final PopupRepository popupRepository;
    private final RedisPublisher redisPublisher;
    private final UserRepository userRepository;


    @Override
    public ChatResponseDTO insertMessage(ChatMessageDTO chatDto) {

        // 유저 확인
        User user = userRepository.findUserByUserTsid(chatDto.getUserTsid())
                .orElseThrow(() -> new BusinessLogicException(USER_NOT_FOUND));

        // 팝업 확인
        Popup popup = popupRepository.findById(chatDto.getPopupId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid popup ID"));

        ChatMessage chatMessage = ChatMessage.builder()
                .popupId(chatDto.getPopupId())
                .sender(user.getNickname())
                .senderImg(user.getImg())
                .message(chatDto.getMessage())
                .sendTime(chatDto.getSendTime())
                .build();

        // 몽고디비에 저장
        chatRepository.save(chatMessage);

        ChatResponseDTO chatResponseDto = ChatResponseDTO.builder()
                .popupId(chatDto.getPopupId())
                .sender(user.getNickname())
                .senderImg(user.getImg())
                .message(chatDto.getMessage())
                .sendTime(chatDto.getSendTime())
                .build();

        // redis publish 호출
        redisPublisher.publish(chatResponseDto);

        return chatResponseDto;
    }


    @Override
    public List<ChatMessage> getChatHistory(Long popupId) {
        // 팝업 확인
        Popup popup = popupRepository.findById(popupId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid popup ID"));
        List<ChatMessage> chatHistory = chatRepository.findAllByPopupId(popupId);

        // UTC 시간을 KST로 변환
//        for (ChatMessage message : chatHistory) {
//            LocalDateTime utcTime = message.getSendTime();  // MongoDB에서 조회된 UTC 시간
//            ZonedDateTime kstTime = utcTime.atZone(ZoneId.of("UTC"))
//                    .withZoneSameInstant(ZoneId.of("Asia/Seoul"));
        for (ChatMessage message : chatHistory) {
            LocalTime utcTime = message.getSendTime();  // MongoDB에서 조회된 UTC 시간
            ZonedDateTime kstTime = utcTime.atDate(LocalDate.now()) // 날짜 정보 추가
                    .atZone(ZoneId.of("UTC"))
                    .withZoneSameInstant(ZoneId.of("Asia/Seoul"));

            message.setSendTime(kstTime.toLocalTime()); // KST로 변환된 시간 설정

        }


        return chatHistory;
    }
}
