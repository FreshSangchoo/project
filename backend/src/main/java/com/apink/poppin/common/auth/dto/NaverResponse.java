package com.apink.poppin.common.auth.dto;

import java.util.Map;

public class NaverResponse implements OAuth2UserResponse{

    private final Map<String, Object> attributes;

    public NaverResponse(final Map<String, Object> attributes) {
        this.attributes = (Map<String, Object>) attributes.get("response");
    }

    @Override
    public String getProvider() {
        return "naver";
    }

    @Override
    public String getProviderId() {
        return attributes.get("id").toString();
    }

    @Override
    public String getName() {
        return attributes.get("name").toString();
    }

    @Override
    public String getEmail()  {
        return attributes.get("email").toString();
    }

    @Override
    public String getAge() {
        String age = attributes.get("age").toString().split("-")[0];
        return age + "대";
    }

    @Override
    public String getGender() {
        return attributes.get("gender").toString();
    }

    @Override
    public String getPhoneNumber() {
        return attributes.get("mobile").toString();
    }
}
