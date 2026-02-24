package com.apink.poppin.api.reservation.service;

import com.apink.poppin.api.reservation.dto.OnsiteReservationDto;
import com.apink.poppin.api.reservation.repository.OnsiteReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class OnsiteReservationServiceImplTest {

    @Mock
    private OnsiteReservationRepository repo;

    @Mock
    private RedisTemplate<String, OnsiteReservationDto> redisTemplate;

    @Mock
    private HashOperations<String, String, OnsiteReservationDto> hashOperations;

    @InjectMocks
    private OnsiteReservationServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(redisTemplate.opsForHash()).thenAnswer(invocation -> hashOperations);
    }

    @Test
    void saveToRedis() {
        OnsiteReservationDto dto = OnsiteReservationDto.builder()
                .popupId(1L)
                .phoneNumber("1234567890")
                .reservationStatementId(1)
                .reservationCount(1)
                .build();

        Map<String, OnsiteReservationDto> map = new HashMap<>();
        when(hashOperations.entries("onsite_reservation:1")).thenReturn(map);

        service.saveToRedis(dto);

        verify(hashOperations, times(1)).put("onsite_reservation:1", "1234567890", dto);
        assertEquals(1, dto.getWaitNumber());
    }

    @Test
    void getFromRedis() {
        OnsiteReservationDto dto = OnsiteReservationDto.builder()
                .popupId(1L)
                .phoneNumber("1234567890")
                .visitedDate(LocalDate.now())
                .reservationStatementId(1)
                .reservationCount(1)
                .waitNumber(1)
                .build();

        when(hashOperations.get("onsite_reservation:1", "1234567890")).thenReturn(dto);

        OnsiteReservationDto result = service.getFromRedis("1234567890", 1L);

        assertEquals(dto, result);
    }
}
