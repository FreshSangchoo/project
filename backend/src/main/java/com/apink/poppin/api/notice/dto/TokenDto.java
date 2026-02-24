package com.apink.poppin.api.notice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TokenDto {

    @NotBlank
    private String token;

    private long userTsid;

    public void changeUserTsid(long userTsid) {
        this.userTsid = userTsid;
    }
}
