package com.apink.poppin.kafka;

import com.apink.poppin.api.notice.dto.NoticeDto;
import com.apink.poppin.api.notice.repository.TokenRepository;
import com.apink.poppin.api.notice.service.NoticeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class KafkaConsumer {

    private final NoticeService noticeService;
    private final TokenRepository tokenRepository;

    @KafkaListener(topics = "made-comment")
    public void madeComment(String kafkaMessage) {
        Map<Object, Object> map = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        try {
            map = mapper.readValue(kafkaMessage, new TypeReference<HashMap<Object, Object>>() {});
        }
        catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        long userTsid = Long.parseLong(map.get("userTsid").toString());
        long reviewId = Long.parseLong(map.get("reviewId").toString());
        String nickname = map.get("nickname").toString();
        String content = map.get("content").toString();

        List<Long> userTsids = new ArrayList<>();
        userTsids.add(userTsid);
        List<String> tokens = getTokens((userTsids));

        System.out.println("userTsid : " + userTsid);
        System.out.println("tokens : " + tokens);

        NoticeDto.MadeComment dto = NoticeDto.MadeComment.builder()
                .userTsid(userTsid)
                .reviewId(reviewId)
                .nickname(nickname)
                .content(content)
                .tokens(tokens)
                .build();

        noticeService.sendMadeComment(dto);
    }

    @KafkaListener(topics = "one-day-before-reservation")
    public void oneDayBeforeReservation(String kafkaMessage) {
        Map<Object, Object> map = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        try {
            map = mapper.readValue(kafkaMessage, new TypeReference<HashMap<Object, Object>>() {});
        }
        catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        long userTsid = Long.parseLong(map.get("userTsid").toString());
        String popupName = map.get("popupName").toString();
        LocalDate reservationDate = LocalDate.parse(map.get("reservationDate").toString());
        LocalTime reservationTime = LocalTime.parse(map.get("reservationTime").toString());
        int reservationCount = Integer.parseInt(map.get("reservationCount").toString());

        // 예약 하루 전인 사용자 뽑는 로직 필요
        List<Long> userTsids = new ArrayList<>();
        userTsids.add(userTsid);

        List<String> tokens = getTokens((userTsids));

        NoticeDto.OneDayBeforeReservation dto = NoticeDto.OneDayBeforeReservation.builder()
                .userTsid(userTsid)
                .popupName(popupName)
                .reservationDate(String.valueOf(reservationDate))
                .reservationTime(String.valueOf(reservationTime))
                .reservationCount(reservationCount)
                .tokens(tokens)
                .build();

        noticeService.sendOneDayBeforeReservation(dto);
    }

    @KafkaListener(topics = "registered-favorite-category")
    public void RegisteredFavoriteCategory(String kafkaMessage) {
        Map<Object, Object> map = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        try {
            map = mapper.readValue(kafkaMessage, new TypeReference<HashMap<Object, Object>>() {});
        }
        catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        List<Long> userTsids = (List<Long>) map.get("userTsid");
        long popupId = Long.parseLong(map.get("popupId").toString());

        List<String> tokens = getTokens((userTsids));

        NoticeDto.RegisteredFavoriteCategory dto = NoticeDto.RegisteredFavoriteCategory.builder()
                .popupId(popupId)
                .tokens(tokens)
                .build();

        noticeService.sendRegisteredFavoriteCategory(dto, userTsids);
    }

    @KafkaListener(topics = "registration-confirmed")
    public void RegistrationConfirmed(String kafkaMessage) {
        Map<Object, Object> map = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        try {
            map = mapper.readValue(kafkaMessage, new TypeReference<HashMap<Object, Object>>() {});
        }
        catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        long userTsid = Long.parseLong(map.get("userTsid").toString());
        String popupName = map.get("popupName").toString();
        LocalDate reservationDate = LocalDate.parse(map.get("reservationDate").toString());
        LocalTime reservationTime = LocalTime.parse(map.get("reservationTime").toString());
        int reservationCount = Integer.parseInt(map.get("reservationCount").toString());

        List<Long> userTsids = new ArrayList<>();
        userTsids.add(userTsid);

        List<String> tokens = getTokens((userTsids));

        NoticeDto.RegistrationConfirmed dto = NoticeDto.RegistrationConfirmed.builder()
                .userTsid(userTsid)
                .popupName(popupName)
                .reservationDate(String.valueOf(reservationDate))
                .reservationTime(String.valueOf(reservationTime))
                .reservationCount(reservationCount)
                .tokens(tokens)
                .build();

        noticeService.sendRegistrationConfirmed(dto);
    }

    @KafkaListener(topics = "advertisement")
    public void Advertisement(String kafkaMessage) {
        Map<Object, Object> map = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        try {
            map = mapper.readValue(kafkaMessage, new TypeReference<HashMap<Object, Object>>() {});
        }
        catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        String title = map.get("title").toString();
        String content = map.get("content").toString();

        List<String> tokens = getAdvertisementToken();

        NoticeDto.Advertisement dto = NoticeDto.Advertisement.builder()
                .title(title)
                .content(content)
                .tokens(tokens)
                .build();

        noticeService.sendAdvertisement(dto);
    }

    // service 푸쉬 동의한 사용자의 토큰 받아오기
    public List<String> getTokens(List<Long> userTsids) {
        return tokenRepository.findUserTokensByUserTsidsAndServicePushConsent(userTsids);
    }

    public List<String> getAdvertisementToken() {
        return tokenRepository.findUserTokensByUserTsidsAndAdverTisementPushConsent();
    }


}
