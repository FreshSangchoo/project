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
public class OnsiteReservationRedisDto {

    private Long onsiteReservationRedisId;
    private Long popupId;
    private String phoneNumber;
    private String name;

    @JsonSerialize(using = LocalDateSerializer.class)
    @JsonDeserialize(using = LocalDateDeserializer.class)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate visitedDate;
    private Long reservationStatementId;
    private Integer reservationCount;
    private Integer waitNumber;

    public void makeRedisDto(OnsiteReservationDto onsiteReservationDto) {
        this.onsiteReservationRedisId = onsiteReservationDto.getOnsiteReservationId();
        this.popupId = onsiteReservationDto.getPopupId();
        this.name = onsiteReservationDto.getName();
        this.phoneNumber = onsiteReservationDto.getPhoneNumber();
        this.visitedDate = onsiteReservationDto.getVisitedDate();
        this.reservationStatementId = onsiteReservationDto.getReservationStatementId();
        this.reservationCount = onsiteReservationDto.getReservationCount();
        this.waitNumber = onsiteReservationDto.getWaitNumber();
    }

    public void changeStatement(Long reservationStatementId) {
        this.reservationStatementId = reservationStatementId;
    }
}
