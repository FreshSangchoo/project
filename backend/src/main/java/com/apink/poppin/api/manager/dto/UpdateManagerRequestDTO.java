package com.apink.poppin.api.manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UpdateManagerRequestDTO {
    private String nickname;
    private String password;
    private String img;
}
