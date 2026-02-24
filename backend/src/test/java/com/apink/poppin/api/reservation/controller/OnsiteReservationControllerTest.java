package com.apink.poppin.api.reservation.controller;

import com.apink.poppin.api.reservation.dto.OnsiteReservationDto;
import com.apink.poppin.api.reservation.service.OnsiteReservationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OnsiteReservationController.class)
public class OnsiteReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OnsiteReservationService service;

    @Autowired
    private ObjectMapper jacksonObjectMapper;

    @Test
    @WithMockUser
    void getOnsiteReservation() throws Exception {
        OnsiteReservationDto dto = OnsiteReservationDto.builder()
                .onsiteReservationId(null)
                .popupId(1L)
                .phoneNumber("010-1234-5678")
                .visitedDate(LocalDate.now())
                .reservationCount(2)
                .reservationStatementId(1)
                .waitNumber(null)
                .build();

        when(service.getFromRedis("010-1234-5678", 1L)).thenReturn(dto);

        mockMvc.perform(get("/api/onsite-reservations/010-1234-5678/1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void createOnsiteReservation() throws Exception {
        OnsiteReservationDto dto = OnsiteReservationDto.builder()
                .onsiteReservationId(null)
                .popupId(1L)
                .phoneNumber("010-1234-5678")
//                .visitedDate(LocalDate.now())
                .reservationCount(2)
                .reservationStatementId(1)
                .waitNumber(null)
                .build();

        String jsonContent = jacksonObjectMapper.writeValueAsString(dto);

        mockMvc.perform(post("/api/onsite-reservations").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonContent))
                .andExpect(status().isOk());
    }
}
