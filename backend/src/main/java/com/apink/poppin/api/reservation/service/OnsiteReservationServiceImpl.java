package com.apink.poppin.api.reservation.service;

import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.popup.repository.PopupRepository;
import com.apink.poppin.api.reservation.dto.OnsiteReservationDto;
import com.apink.poppin.api.reservation.dto.OnsiteReservationRedisDto;
import com.apink.poppin.api.reservation.dto.OnsiteReservationRequestDto;
import com.apink.poppin.api.reservation.dto.OnsiteReservationWaitingDto;
import com.apink.poppin.api.reservation.entity.OnsiteReservation;
import com.apink.poppin.api.reservation.entity.ReservationStatement;
import com.apink.poppin.api.reservation.repository.OnsiteReservationRepository;
import com.apink.poppin.api.reservation.repository.ReservationStatementRepository;
import com.apink.poppin.common.exception.dto.BusinessLogicException;
import com.apink.poppin.common.exception.dto.ExceptionCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnsiteReservationServiceImpl implements OnsiteReservationService {

    private static final String RESERVATION_KEY_POPUP = "ONSITE_BY_POPUP_";
    private static final String RESERVATION_KEY_PHONE = "ONSITE_BY_PHONE_";

    // popup id를 통해 접근. 대기 번호 설정을 위해 sorted set 사용
    private final ZSetOperations<String, Object> zSetOperations;

    // 사용자가 다른 팝업에 대기하고자 하는 경우 전화번호만으로 대기 중인 정보 조회
    private final ValueOperations<String, Object> valueOperations;
    private final RedisTemplate<String, Object> redisTemplate;

    private final OnsiteReservationRepository onsiteReservationRepository;
    private final PopupRepository popupRepository;
    private final ReservationStatementRepository reservationStatementRepository;

    @Override
    @Transactional
    public OnsiteReservationRedisDto createOnsiteReservation(OnsiteReservationDto onsiteReservationDto) {

        String keyByPopup = RESERVATION_KEY_POPUP + onsiteReservationDto.getPopupId();
        String keyByPhonePattern = RESERVATION_KEY_PHONE + onsiteReservationDto.getPhoneNumber();

        Set<String> keys = redisTemplate.keys(keyByPhonePattern + "*");

        assert keys != null;
        for (String key : keys) {
            Object obj = valueOperations.get(key);
            assert obj != null;
            if (obj instanceof OnsiteReservationRedisDto dto) {
                if (dto.getReservationStatementId() == 1) {
                    throw new BusinessLogicException(ExceptionCode.ONSITE_ALREADY_EXIST);
                }
            }
        }

        Popup popup = popupRepository.findById(onsiteReservationDto.getPopupId())
                .orElseThrow(() -> new BusinessLogicException(ExceptionCode.POPUP_NOT_FOUND));
        ReservationStatement reservationStatement = reservationStatementRepository.findById(1L)
                .orElseThrow(() -> new IllegalStateException("reservationStatement not found"));

        Integer waitNumber = getWaitNumber(keyByPopup);

        OnsiteReservation reservation = OnsiteReservation.builder()
                .popup(popup)
                .phoneNumber(onsiteReservationDto.getPhoneNumber())
                .name(onsiteReservationDto.getName())
                .visitedDate(LocalDate.now())
                .reservationStatement(reservationStatement)
                .reservationCount(onsiteReservationDto.getReservationCount())
                .waitNumber(waitNumber)
                .build();

        OnsiteReservation onsiteReservation = onsiteReservationRepository.save(reservation);

        onsiteReservationDto.createReservation(onsiteReservation.getOnsiteReservationId(), waitNumber);

        double score = makeScore(onsiteReservationDto.getReservationStatementId(), onsiteReservationDto.getWaitNumber());

        OnsiteReservationRedisDto redisDto = OnsiteReservationRedisDto.builder().build();
        redisDto.makeRedisDto(onsiteReservationDto);

        String keyByPhone = RESERVATION_KEY_PHONE + onsiteReservationDto.getPhoneNumber()
                + "_" + onsiteReservation.getOnsiteReservationId();

        zSetOperations.add(keyByPopup, redisDto, score);
        valueOperations.set(keyByPhone, redisDto);
        Instant ttl = getTimeToLive();
        redisTemplate.expireAt(keyByPopup, ttl);
        redisTemplate.expireAt(keyByPhone, ttl);

        return redisDto;
    }

    @Override
    public OnsiteReservationWaitingDto getOnsiteReservationByKakaoLink(long onsiteReservationId, long popupId) {

        String keyByPopup = RESERVATION_KEY_POPUP + popupId;
        Set<Object> reservations = zSetOperations.rangeByScore(keyByPopup, 0, Double.MAX_VALUE);
        OnsiteReservation onsiteReservation = onsiteReservationRepository.findById(onsiteReservationId)
                .orElseThrow(() -> new BusinessLogicException(ExceptionCode.ONSITE_NOT_FOUND));

        assert reservations != null;
        for (Object obj : reservations) {
            if (obj instanceof OnsiteReservationRedisDto redisDto) {
                if (redisDto.getOnsiteReservationRedisId() == onsiteReservationId) {

                    Integer rank = getRank(keyByPopup, redisDto);

                    OnsiteReservationWaitingDto dto = OnsiteReservationWaitingDto.builder().build();
                    dto.makeDtoWithRedisDto(redisDto);
                    dto.setRank(rank);
                    dto.setPopupName(onsiteReservation.getPopup().getName());
                    return dto;
                }
            }
        }

        return OnsiteReservationWaitingDto.builder()
                .onsiteReservationId(onsiteReservation.getOnsiteReservationId())
                .name(onsiteReservation.getName())
                .popupId(onsiteReservation.getPopup().getPopupId())
                .popupName(onsiteReservation.getPopup().getName())
                .reservationStatementId(onsiteReservation.getReservationStatement().getReservationStatementId())
                .reservationCount(onsiteReservation.getReservationCount())
                .phoneNumber(onsiteReservation.getPhoneNumber())
                .visitedDate(onsiteReservation.getVisitedDate())
                .waitNumber(onsiteReservation.getWaitNumber())
                .build();
    }

    @Override
    public OnsiteReservationWaitingDto getOnsiteReservationByPhoneNumber(String phoneNumber) {

        String keyByPhonePattern = RESERVATION_KEY_PHONE + phoneNumber;
        Set<String> keys = redisTemplate.keys(keyByPhonePattern + "*");
        assert keys != null;
        for (String key : keys) {
            Object obj = valueOperations.get(key);
            assert obj != null;
            if (obj instanceof OnsiteReservationRedisDto redisDto) {
                if (redisDto.getReservationStatementId() == 1) {
                    String keyByPopup = RESERVATION_KEY_POPUP + redisDto.getPopupId();
                    Integer rank = getRank(keyByPopup, redisDto);

                    Popup popup = popupRepository.findById(redisDto.getPopupId())
                            .orElseThrow(() -> new BusinessLogicException(ExceptionCode.POPUP_NOT_FOUND));

                    OnsiteReservationWaitingDto onsiteReservationDto = OnsiteReservationWaitingDto.builder().build();
                    onsiteReservationDto.makeDtoWithRedisDto(redisDto);
                    onsiteReservationDto.setRank(rank);
                    onsiteReservationDto.setPopupName(popup.getName());
                    return onsiteReservationDto;
                }
            }
        }

        throw new BusinessLogicException(ExceptionCode.ONSITE_NOT_FOUND);
    }

    @Override
    @Transactional
    public OnsiteReservationDto changeOnsiteReservation(OnsiteReservationRequestDto onsiteReservationRequestDto) {
        String keyForPopup = RESERVATION_KEY_POPUP + onsiteReservationRequestDto.getPopupId();
        String keyForPhone = RESERVATION_KEY_PHONE + onsiteReservationRequestDto.getPhoneNumber()
                + "_" + onsiteReservationRequestDto.getOnsiteReservationId();

        Set<Object> reservations = zSetOperations.rangeByScore(keyForPopup, 0, Double.MAX_VALUE);

        assert reservations != null;
        for (Object obj : reservations) {
            if (obj instanceof OnsiteReservationRedisDto redisDto) {
                if (redisDto.getOnsiteReservationRedisId().equals(onsiteReservationRequestDto.getOnsiteReservationId())
                && redisDto.getPhoneNumber().equals(onsiteReservationRequestDto.getPhoneNumber())) {
                    zSetOperations.remove(keyForPopup, redisDto);
                    redisDto.changeStatement(onsiteReservationRequestDto.getReservationStatementId());

                    double score = makeScore(onsiteReservationRequestDto.getReservationStatementId(), redisDto.getWaitNumber());
                    zSetOperations.add(keyForPopup, redisDto, score);
                    valueOperations.set(keyForPhone, redisDto);

                    OnsiteReservationDto onsiteReservationDto = OnsiteReservationDto.builder().build();
                    onsiteReservationDto.makeDtoWithRedisDto(redisDto);

                    return onsiteReservationDto;
                }
            }
        }

        throw new BusinessLogicException(ExceptionCode.ONSITE_NOT_FOUND);
    }

    @Override
    public List<OnsiteReservationDto> getOnsiteReservations(long popupId) {
        String keyForPopup = RESERVATION_KEY_POPUP + popupId;

        Set<Object> reservations = zSetOperations.rangeByScore(keyForPopup, 0, Double.MAX_VALUE);
        assert reservations != null;
        List<OnsiteReservationDto> list = new ArrayList<>();
        for (Object obj : reservations) {
            if (obj instanceof OnsiteReservationRedisDto redisDto) {
                if (redisDto.getReservationStatementId() != 1) continue;

                OnsiteReservationDto onsiteReservationDto = OnsiteReservationDto.builder().build();
                onsiteReservationDto.makeDtoWithRedisDto(redisDto);
                Integer rank = getRank(keyForPopup, redisDto);

                onsiteReservationDto.setRank(rank);
                list.add(onsiteReservationDto);
            }
        }
        return list;
    }

    @Override
    @Transactional
    public void saveScheduling() {
        Set<String> keys = redisTemplate.keys(RESERVATION_KEY_POPUP + "*");

        assert keys != null;
        for (String key : keys) {
            Set<Object> reservations = zSetOperations.rangeByScore(key, 0, Double.MAX_VALUE);

            assert reservations != null;
            for (Object obj : reservations) {
                try {
                    if (obj instanceof OnsiteReservationRedisDto redisDto) {
                        OnsiteReservation onsiteReservation = onsiteReservationRepository.findById(redisDto.getOnsiteReservationRedisId())
                                .orElseThrow(() -> new BusinessLogicException(ExceptionCode.ONSITE_NOT_FOUND));

                        if (redisDto.getReservationStatementId() == 1) {
                            redisDto.changeStatement(2L);
                        }
                        ReservationStatement statement = ReservationStatement.builder()
                                .reservationStatementId(redisDto.getReservationStatementId()).build();
                        onsiteReservation.update(statement);
                    }
                } catch (Exception e) {
                    log.error(e.getMessage());
                }
            }
        }
    }

    @Override
    public OnsiteReservationDto calculateRank(OnsiteReservationRedisDto redisDto) {
        String key = RESERVATION_KEY_POPUP + redisDto.getPopupId();
        Integer rank = getRank(key, redisDto);

        OnsiteReservationDto onsiteReservationDto = OnsiteReservationDto.builder().build();
        onsiteReservationDto.makeDtoWithRedisDto(redisDto);
        onsiteReservationDto.setRank(rank);

        return onsiteReservationDto;
    }

    private Integer getWaitNumber(String key) {
        Long size = zSetOperations.size(key);
        if (size == null) return 1;

        return size.intValue() + 1;
    }

    private double makeScore(long reservationStatementId, int waitNumber) {
        return reservationStatementId * 10000 + waitNumber;
    }

    private Integer getRank(String key, OnsiteReservationRedisDto dto) {
        Long rank = zSetOperations.rank(key, dto);
        if (rank == null) {
            throw new BusinessLogicException(ExceptionCode.ONSITE_NOT_FOUND);
        }
        return rank.intValue();
    }

    private Instant getTimeToLive() {
        LocalDateTime now = LocalDateTime.now();

        // 다음날 4시
        LocalDateTime ttl;
        if (now.getHour() < 4) {
            ttl = now.plusDays(0).withHour(4).withMinute(0).withSecond(0).withNano(0);
        } else {
            ttl = now.plusDays(1).withHour(4).withMinute(0).withSecond(0).withNano(0);
        }

        return ttl.atZone(ZoneId.systemDefault()).toInstant();
    }
}
