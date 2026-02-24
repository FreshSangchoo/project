package com.apink.poppin.api.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ReviewDto {
    private long reviewId;
    private long popupId;
    private long userTsid;
    private String nickname;
    private String img;
    private float rating;
    private String title;
    private String content;
    private String thumbnail;
    private List<ReviewImageDto> reviewImages;
    private Instant createdAt;
    private List<CommentDto> commentDtoList;
}
