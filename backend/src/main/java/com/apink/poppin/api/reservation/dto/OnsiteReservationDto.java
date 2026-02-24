package com.apink.poppin.api.reservation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import lombok.*;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class OnsiteReservationDto {

    private Long onsiteReservationId;

    private Long popupId;
    private String name;
    private String phoneNumber;

    @JsonSerialize(using = LocalDateSerializer.class)
    @JsonDeserialize(using = LocalDateDeserializer.class)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate visitedDate;
    private Long reservationStatementId;
    private Integer reservationCount;
    private Integer waitNumber;
    private Integer rank;

    public void createReservation(long onsiteReservationId, int waitNumber) {
        this.onsiteReservationId = onsiteReservationId;
        this.visitedDate = LocalDate.now();
        this.reservationStatementId = 1L;
        this.waitNumber = waitNumber;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public void makeDtoWithRedisDto(OnsiteReservationRedisDto onsiteReservationRedisDto) {
        this.onsiteReservationId = onsiteReservationRedisDto.getOnsiteReservationRedisId();
        this.name = onsiteReservationRedisDto.getName();
        this.popupId = onsiteReservationRedisDto.getPopupId();
        this.phoneNumber = onsiteReservationRedisDto.getPhoneNumber();
        this.visitedDate = onsiteReservationRedisDto.getVisitedDate();
        this.reservationStatementId = onsiteReservationRedisDto.getReservationStatementId();
        this.reservationCount = onsiteReservationRedisDto.getReservationCount();
        this.waitNumber = onsiteReservationRedisDto.getWaitNumber();
    }
}
