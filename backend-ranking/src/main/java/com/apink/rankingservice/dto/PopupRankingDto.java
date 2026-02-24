package com.apink.rankingservice.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class PopupRankingDto {
    private long popupId;
    private LocalDate creationDate;
    private int views;
    private int likes;
    private double reviewScore;
    private int reviewCount;
    private int reservations;
}