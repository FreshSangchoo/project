package com.apink.poppin.api.popup.dto;

import lombok.*;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRecommendationDto {
    private long popupId;
    private String popupName;
    private String popupContent;
    private String reviewTitle;
    private String reviewContent;
}
