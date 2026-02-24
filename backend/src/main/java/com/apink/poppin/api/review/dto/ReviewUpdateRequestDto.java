package com.apink.poppin.api.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class ReviewUpdateRequestDto {
    float rating;
    String title;
    String thumbnail;
    String content;

    public void updateThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }
}
