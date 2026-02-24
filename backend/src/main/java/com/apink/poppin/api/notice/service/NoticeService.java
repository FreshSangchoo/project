package com.apink.poppin.api.notice.service;

import com.apink.poppin.api.notice.dto.NoticeDto;
import com.apink.poppin.api.notice.dto.TokenDto;
import com.apink.poppin.api.notice.entity.Notice;
import com.apink.poppin.api.notice.entity.Token;
import com.apink.poppin.api.notice.repository.NoticeRepository;
import com.apink.poppin.api.notice.repository.TokenRepository;
import com.apink.poppin.api.reservation.entity.PreReservation;
import com.apink.poppin.api.reservation.repository.PreReservationRepository;
import com.apink.poppin.api.user.entity.User;
import com.apink.poppin.api.user.repository.UserRepository;
import com.apink.poppin.common.exception.dto.BusinessLogicException;
import com.apink.poppin.common.exception.dto.ExceptionCode;
import com.apink.poppin.kafka.KafkaProducer;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.WebpushConfig;
import com.google.firebase.messaging.WebpushNotification;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final TokenRepository tokenRepository;
    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;
    private final KafkaProducer kafkaProducer;
    private final PreReservationRepository preReservationRepository;

    @Transactional
    public void sendMadeComment(NoticeDto.MadeComment madeComment) {
        List<String> tokens = madeComment.getTokens();

        String title = "[" + madeComment.getNickname() + "]" + " 님이 댓글을 작성했습니다.";
        String body = madeComment.getContent();

        Notice notice = Notice.builder()
                .userTsid(madeComment.getUserTsid())
                .title(title)
                .content(body)
                .kind(1)
                .build();

        noticeRepository.save(notice);
        System.out.println(tokens);

        for(String token : tokens) {
            System.out.println(token);
            Message message = Message.builder()
                    .setToken(token)
                    .putData("noticeType", "1")
                    .setWebpushConfig(WebpushConfig.builder().putHeader("ttl", "1000")
                            .setNotification(new WebpushNotification(title, body))
                            .build())
                    .build();

            System.out.println("보내는 중1");
            FirebaseMessaging.getInstance().sendAsync(message);
        }
    }

    @Transactional
    public void sendOneDayBeforeReservation(NoticeDto.OneDayBeforeReservation oneDayBeforeReservation) {
        List<String> tokens = oneDayBeforeReservation.getTokens();

        String title = "[" + oneDayBeforeReservation.getPopupName() + "] 방문 하루 전 입니다.";
        String body = "일시) " + oneDayBeforeReservation.getReservationDate() + " " + oneDayBeforeReservation.getReservationTime() + " 인원) " + oneDayBeforeReservation.getReservationCount() + "명";

        Notice notice = Notice.builder()
                .userTsid(oneDayBeforeReservation.getUserTsid())
                .title(title)
                .content(body)
                .kind(2)
                .build();

        noticeRepository.save(notice);

        for(String token : tokens) {
            Message message = Message.builder()
                    .setToken(token)
                    .putData("noticeType", "2")
                    .setWebpushConfig(WebpushConfig.builder().putHeader("ttl", "1000")
                            .setNotification(new WebpushNotification(title, body))
                            .build())
                    .build();

            System.out.println("보내는 중2");
            FirebaseMessaging.getInstance().sendAsync(message);
        }
    }

    @Transactional
    public void sendRegisteredFavoriteCategory(NoticeDto.RegisteredFavoriteCategory registeredFavoriteCategory, List<Long> userTsids) {
        List<String> tokens = registeredFavoriteCategory.getTokens();

        String title = "선호하시는 카테고리에 새로운 팝업이 등록됐어요!";
        String body = "완전 럭키키비자나~ 🍀 (클릭 시 팝업 정보로 이동합니다.)";

        for(int i = 0; i < tokens.size(); i++) {
            Notice notice = Notice.builder()
                    .userTsid(userTsids.get(i))
                    .title(title)
                    .content(body)
                    .kind(3)
                    .build();

            noticeRepository.save(notice);
        }

        for(String token : tokens) {
            Message message = Message.builder()
                    .setToken(token)
                    .putData("noticeType", "3")
                    .setWebpushConfig(WebpushConfig.builder().putHeader("ttl", "1000")
                            .setNotification(new WebpushNotification(title, body))
                            .build())
                    .build();

            System.out.println("보내는 중3");
            FirebaseMessaging.getInstance().sendAsync(message);
        }
    }

    @Transactional
    public void sendRegistrationConfirmed(NoticeDto.RegistrationConfirmed registrationConfirmed) {
        List<String> tokens = registrationConfirmed.getTokens();

        String title = "[" + registrationConfirmed.getPopupName() + "] 에약이 확정되었습니다.";
        String body = "일시) " + registrationConfirmed.getReservationDate() + " " + registrationConfirmed.getReservationTime() + " 인원) " + registrationConfirmed.getReservationCount() + "명";

        Notice notice = Notice.builder()
                .userTsid(registrationConfirmed.getUserTsid())
                .title(title)
                .content(body)
                .kind(4)
                .build();

        noticeRepository.save(notice);

        for(String token : tokens) {
            Message message = Message.builder()
                    .setToken(token)
                    .putData("noticeType", "4")
                    .setWebpushConfig(WebpushConfig.builder().putHeader("ttl", "1000")
                            .setNotification(new WebpushNotification(title, body))
                            .build())
                    .build();

            System.out.println("보내는 중4");
            FirebaseMessaging.getInstance().sendAsync(message);
        }
    }

    @Transactional
    public void sendAdvertisement(NoticeDto.Advertisement advertisement) {
        List<String> tokens = advertisement.getTokens();

        String title = advertisement.getTitle();
        String body = advertisement.getContent();

        for(String token : tokens) {
            Message message = Message.builder()
                    .setToken(token)
                    .putData("noticeType", "5")
                    .setWebpushConfig(WebpushConfig.builder().putHeader("ttl", "1000")
                            .setNotification(new WebpushNotification(title, body))
                            .build())
                    .build();

            System.out.println("보내는 중5");
            FirebaseMessaging.getInstance().sendAsync(message);
        }
    }

    @Transactional
    public void createToken(TokenDto token) {
        User user = userRepository.findUserByUserTsid(token.getUserTsid())
                .orElseThrow(() -> new BusinessLogicException(ExceptionCode.USER_NOT_FOUND));

        Token newToken = Token.builder()
                .userToken(token.getToken())
                .user(user)
                .build();

        tokenRepository.save(newToken);
    }

    @Transactional(readOnly = true)
    public void checkReservations() {
        String topic = "one-day-before-reservation";
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        List<PreReservation> pres =  preReservationRepository.findAllByReservationDateTomorrow(tomorrow);

        for(PreReservation preReservation : pres) {
            NoticeDto.OneDayBeforeReservation notice =  NoticeDto.OneDayBeforeReservation.builder()
                    .userTsid(preReservation.getUser().getUserTsid())
                    .popupName(preReservation.getPopup().getName())
                    .reservationDate(String.valueOf(preReservation.getReservationDate()))
                    .reservationTime(String.valueOf(preReservation.getReservationTime()))
                    .reservationCount(preReservation.getReservationCount())
                    .build();

            kafkaProducer.send(topic, notice);
        }
    }

    public void createAdvertisement(NoticeDto.Advertisement advertisement) {
        String topic = "advertisement";
        System.out.println(advertisement.getTokens());

        NoticeDto.Advertisement notice = NoticeDto.Advertisement.builder()
                .title(advertisement.getTitle())
                .content(advertisement.getContent())
                .build();

        kafkaProducer.send(topic, notice);
    }

    @Transactional(readOnly = true)
    public List<NoticeDto.Response> getNotices(long userTsid) {
        List<Notice> responses = noticeRepository.findByUserTsid(userTsid);

        return responses.stream()
                .map(this::noticeToResponse)
                .toList();
    }

    @Transactional
    public void deleteNotices(long userTsid) {
        noticeRepository.deleteByUserTsid(userTsid);
    }

    public NoticeDto.Response noticeToResponse(Notice notice) {
        return NoticeDto.Response.builder()
                .title(notice.getTitle())
                .content(notice.getContent())
                .kind(notice.getKind())
                .build();
    }

}
