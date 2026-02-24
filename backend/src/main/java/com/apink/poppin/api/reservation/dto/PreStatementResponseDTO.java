package com.apink.poppin.api.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
@AllArgsConstructor
public class PreStatementResponseDTO {

    private Long preReservationId;
    private Long reservationStatementId;
    private String userTsid;
    private Long popupId;
}
