package com.apink.rankingservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Builder
@Getter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class PopupRanking implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY )
    private Long popupRankingId;

    @Column(nullable = false)
    private Long popupId;

    @Column(nullable = false)
    private int views;

    @Column(nullable = false)
    private int likes;

    @Column(nullable = false)
    private double reviewScore;

    @Column(nullable = false)
    private int reviewCount;

    @Column(nullable = false)
    private int reservations;

    @Column(nullable = true)
    private LocalDate creationDate;
}
