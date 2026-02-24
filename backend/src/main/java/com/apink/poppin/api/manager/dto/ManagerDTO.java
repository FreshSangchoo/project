package com.apink.poppin.api.manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@AllArgsConstructor
public class ManagerDTO {
    private String managerTsid;
    private String nickname;
    private String id;
    private String password;
    private String role;
    private String img;
}
