package com.apink.poppin.api.notice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

public class NoticeDto {

    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MadeComment {
        private long userTsid;
        private long reviewId;
        private String nickname;
        private String content;
        private List<String> tokens;
    }

    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OneDayBeforeReservation {
        private long userTsid;
        private String popupName;
        private String reservationDate;
        private String reservationTime;
        private int reservationCount;
        private List<String> tokens;
    }

    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisteredFavoriteCategory {
        private List<Long> userTsid;
        private long popupId;
        private List<String> tokens;
    }

    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegistrationConfirmed {
        private long userTsid;
        private String popupName;
        private String reservationDate;
        private String reservationTime;
        private int reservationCount;
        private List<String> tokens;
    }

    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Advertisement {
        private String title;
        private String content;
        private List<String> tokens;
    }

    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private String title;
        private String content;
        private int kind;
    }

}
