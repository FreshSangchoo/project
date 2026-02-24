package com.apink.poppin.api.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
@AllArgsConstructor
public class PreStatementRequestDTO {

    private Long preReservationId;
    private Long reservationStatementId;
    private Long userTsid;
    private Long popupId;
}
