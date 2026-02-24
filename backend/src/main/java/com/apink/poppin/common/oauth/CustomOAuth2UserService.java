package com.apink.poppin.common.oauth;

import com.apink.poppin.api.user.dto.UserDto;
import com.apink.poppin.api.user.entity.User;
import com.apink.poppin.api.user.entity.UserConsent;
import com.apink.poppin.api.user.repository.UserConsentRepository;
import com.apink.poppin.api.user.repository.UserRepository;
import com.apink.poppin.common.auth.dto.KakaoResponse;
import com.apink.poppin.common.auth.dto.NaverResponse;
import com.apink.poppin.common.auth.dto.OAuth2UserResponse;
import com.apink.poppin.common.auth.service.NicknameService;
import com.apink.poppin.common.util.SnowflakeTsidUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final UserConsentRepository userConsentRepository;
    private final SnowflakeTsidUtil snowflakeTsidUtil;
    private final NicknameService nicknameService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

        OAuth2User oAuth2User = super.loadUser(userRequest);

        System.out.println(oAuth2User);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        OAuth2UserResponse oAuth2UserResponse = null;
        switch (registrationId) {
            case "naver":
                oAuth2UserResponse = new NaverResponse(oAuth2User.getAttributes());
                break;
            case "kakao":
                oAuth2UserResponse = new KakaoResponse(oAuth2User.getAttributes());
                break;
            default:
                return null;
        }

        String providerId = oAuth2UserResponse.getProvider() + "_" + oAuth2UserResponse.getProviderId();

        User existData = userRepository.findUserByProviderId(providerId);

        if(existData == null) {
            long tsid = snowflakeTsidUtil.nextId();
            System.out.println(tsid);
            String nickname = nicknameService.createNickname();

            User user = User.builder()
                    .userTsid(tsid)
                    .providerId(providerId)
                    .providerName(oAuth2UserResponse.getProvider())
                    .name(oAuth2UserResponse.getName())
                    .nickname(nickname)
                    .email(oAuth2UserResponse.getEmail())
                    .age(oAuth2UserResponse.getAge())
                    .gender(oAuth2UserResponse.getGender())
                    .phoneNumber(oAuth2UserResponse.getPhoneNumber())
                    .img("/uploads/profile.png")
                    .role("ROLE_USER")
                    .state(true)
                    .build();

            UserConsent userConsent = UserConsent.builder()
                    .user(user)
                    .servicePushConsent(false)
                    .marketingConsent(false)
                    .marketingUpdatedAt(LocalDateTime.now())
                    .serviceUpdatedAt(LocalDateTime.now())
                    .build();

            user.setUserConsents(userConsent);

            userRepository.save(user);

            UserDto.Login login = UserDto.Login.builder()
                    .userTsid(user.getUserTsid())
                    .role(user.getRole())
                    .signed(false)
                    .build();

            return new CustomOAuth2User(login);

        }

        else {
            UserDto.Login login = UserDto.Login.builder()
                    .userTsid(existData.getUserTsid())
                    .role(existData.getRole())
                    .signed(true)
                    .build();

            return new CustomOAuth2User(login);
        }
    }
}
