package com.apink.poppin.api.popup.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PopupRankingDto {

    private long popupId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String image;
    private long rank;

}
