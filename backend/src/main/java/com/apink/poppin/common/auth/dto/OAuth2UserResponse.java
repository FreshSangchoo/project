package com.apink.poppin.common.auth.dto;

public interface OAuth2UserResponse {

    String getProvider();

    String getProviderId();

    String getName();

    String getEmail();

    String getAge();

    String getGender();

    String getPhoneNumber();
}
