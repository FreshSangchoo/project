package com.apink.rankingservice.util;

import com.apink.rankingservice.dto.PopupRankingDto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class RankCalculator {

    private static final double VIEW_WEIGHT = 0.5;
    private static final double LIKE_WEIGHT = 1.5;
    private static final double RESERVATION_WEIGHT = 2.0;
    private static final double GLOBAL_AVERAGE = 5.0;
    private static final int MINIMUM_REVIEW_COUNT = 3;

    public static double calculatePopupRank(PopupRankingDto popup) {
        System.out.println(popup);

        // 기본 점수 계산
        double viewScore = popup.getViews() * VIEW_WEIGHT;
        double likeScore = popup.getLikes() * LIKE_WEIGHT;
        double reviewScore = calculateBayesianAverage(popup.getReviewScore(), Math.toIntExact(popup.getReviewCount()));
        double reservationScore = popup.getReservations() * RESERVATION_WEIGHT;

        // 총점 계산
        double totalScore = viewScore + likeScore + reviewScore + reservationScore;

        // 시간 감쇠 적용
        long daysSinceCreation = ChronoUnit.DAYS.between(popup.getCreationDate(), LocalDate.now());
        double timeDecay = 1 / (1 + Math.log(daysSinceCreation + 1));

        // 활동성 보너스
        double activityBonus = 1 + (0.1 * (popup.getReservations() > 0 ? 1 : 0));

        // 최종 점수 계산

        return totalScore * timeDecay * activityBonus;
    }

    private static double calculateBayesianAverage(double score, int count) {
        return (GLOBAL_AVERAGE * MINIMUM_REVIEW_COUNT + score * count) / (MINIMUM_REVIEW_COUNT + count);
    }
}