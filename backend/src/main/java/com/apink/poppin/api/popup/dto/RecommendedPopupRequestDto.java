package com.apink.poppin.api.popup.dto;

import com.apink.poppin.api.review.dto.ReviewDto;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Builder
@Getter
@Setter
public class RecommendedPopupRequestDto {
    List<PopupDTO> popupListRequest;
    List<PopupDTO> reservedPopupListRequest;
    List<ReviewRecommendationDto> reviewDtoListRequest;
    List<PopupDTO> heartedPopupListRequest;
    List<String> categoryListRequest;
}
