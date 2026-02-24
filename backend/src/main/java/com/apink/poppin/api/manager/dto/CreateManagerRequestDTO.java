package com.apink.poppin.api.manager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CreateManagerRequestDTO {
    private String id;
    private String nickname;
    private String password;
    private String img;
}
