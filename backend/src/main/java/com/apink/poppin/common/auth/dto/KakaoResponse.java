package com.apink.poppin.common.auth.dto;

import lombok.RequiredArgsConstructor;

import java.util.Map;

@RequiredArgsConstructor
public class KakaoResponse implements OAuth2UserResponse{

    private final Map<String, Object> attributes;

    @Override
    public String getProvider() {
        return "kakao";
    }

    @Override
    public String getProviderId() {
        return attributes.get("id").toString();
    }

    @Override
    public String getName() {
        Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");
        return  properties.get("nickname").toString();
    }

    @Override
    public String getEmail() {

        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        return  kakaoAccount.get("email").toString();
    }

    @Override
    public String getAge() {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        String age = kakaoAccount.get("age_range").toString().split("~")[0];
        return age + "대";
    }

    @Override
    public String getGender() {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        return kakaoAccount.get("gender").equals("male") ? "M" : "F";
    }

    @Override
    public String getPhoneNumber() {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        return kakaoAccount.get("phone_number").toString();
    }
}
