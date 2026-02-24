package com.apink.poppin.api.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Builder
@AllArgsConstructor
public class ReservationResponseDto {

    private long reservationId;
    private long popupId;
    private String title;
    private String userName;
    private String img;
    private LocalDate created_at;
    private LocalDate reservationDate;
    private LocalTime reservationTime;
    private Integer reservationCount;
    private long reservationStatement;
    private long kind;

    public ReservationResponseDto() {}

    // pre reservation
    public ReservationResponseDto(long reservationId, long popupId, String title, String userName, String img, LocalDate created_at, LocalDate reservationDate, LocalTime reservationTime, Integer reservationCount, long reservationStatement) {
        this.reservationId = reservationId;
        this.popupId = popupId;
        this.title = title;
        this.userName = userName;
        this.img = img;
        this.created_at = created_at;
        this.reservationDate = reservationDate;
        this.reservationTime = reservationTime;
        this.reservationCount = reservationCount;
        this.reservationStatement = reservationStatement;
        this.kind = 1;
    }

    // onsite reservation
    public ReservationResponseDto(long reservationId, String userName, long popupId, String title, String img, LocalDate reservationDate, Integer reservationCount, long reservationStatement) {
        this.reservationId = reservationId;
        this.userName = userName;
        this.popupId = popupId;
        this.title = title;
        this.img = img;
        this.reservationDate = reservationDate;
        this.reservationCount = reservationCount;
        this.reservationStatement = reservationStatement;
        this.kind = 2;
    }

    public ReservationResponseDto(long popupId, String title, String img) {
        this.title = title;
        this.popupId = popupId;
        this.img = img;
    }



}

