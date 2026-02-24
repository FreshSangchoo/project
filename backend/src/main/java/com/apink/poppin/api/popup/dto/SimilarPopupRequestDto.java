package com.apink.poppin.api.popup.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class SimilarPopupRequestDto {
    PopupDTO currentPopupRequest;
    List<PopupDTO> popupListRequest;
}
