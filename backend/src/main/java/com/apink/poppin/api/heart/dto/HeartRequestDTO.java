package com.apink.poppin.api.heart.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeartRequestDTO {

    private Long userTsid;
    private Long popupId;

}
