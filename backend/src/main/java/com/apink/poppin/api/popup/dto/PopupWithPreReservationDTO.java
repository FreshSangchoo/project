package com.apink.poppin.api.popup.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PopupWithPreReservationDTO {

    private Long popupId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;

    private String hours;
    private String snsUrl;
    private String pageUrl;

    private String content;
    private String description;

    private String address;
    private Double lat;
    private Double lon;

    private int heart;
    private int hit;
    private Double rating;

    private boolean deleted;

    private String managerTsId;

    private List<String> images;
    private List<String> categories;

    // 사전 예약이 있는지 확인
    private boolean checkPreReservation;

    // 사전 예약 정보
    private LocalDateTime preReservationOpenAt;

    private Integer term;
    private Integer maxPeoplePerSession;
    private Integer maxReservationsPerPerson;
    private String warning;
}
