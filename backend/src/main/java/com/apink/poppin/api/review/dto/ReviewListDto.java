package com.apink.poppin.api.review.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class ReviewListDto {
    private long reviewId;
    private long userTsid;
    private String nickname;
    private String img;
    private String thumbnail;
    private float rating;
    private String title;
    private String content;
    private Instant createdAt;
}
