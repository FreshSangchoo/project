package com.apink.poppin.common.oauth;

import com.apink.poppin.api.user.entity.User;
import com.apink.poppin.api.user.repository.UserRepository;
import com.apink.poppin.common.auth.entity.UserRefreshToken;
import com.apink.poppin.common.auth.repository.UserRefreshTokenRepository;
import com.apink.poppin.common.exception.dto.BusinessLogicException;
import com.apink.poppin.common.exception.dto.ExceptionCode;
import com.apink.poppin.common.util.JwtTokenUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.Collection;
import java.util.Iterator;

@Component
@RequiredArgsConstructor
public class CustomOAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenUtil jwtTokenUtil;
    private final UserRefreshTokenRepository userRefreshTokenRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        CustomOAuth2User customUser = (CustomOAuth2User) oauthToken.getPrincipal();

        long userTsid = Long.parseLong(customUser.getName());

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
        GrantedAuthority auth = iterator.next();
        String role = auth.getAuthority();

        String refresh = null;
        if(userRefreshTokenRepository.existsUserRefreshTokenByUser_UserTsid(userTsid)){
            String refreshToken = userRefreshTokenRepository.findUserRefreshTokenByUser_UserTsid(userTsid).getRefresh();
            if(!jwtTokenUtil.isExpired(refreshToken)) {
                refresh = refreshToken;
                response.addCookie(createCookie("refresh", refresh));
                response.sendRedirect("/loading");
                return;
            } else {
                userRefreshTokenRepository.deleteUserRefreshTokenByUser_UserTsid(userTsid);
            }
        }

        refresh = jwtTokenUtil.createToken("refresh", userTsid, role, 30 * 60 * 60 * 24 * 1000L);
        User user = userRepository.findUserByUserTsid(userTsid)
                .orElseThrow(() -> new BusinessLogicException(ExceptionCode.USER_NOT_FOUND));

        UserRefreshToken refreshToken = UserRefreshToken.builder()
                .user(user)
                .refresh(refresh)
                .build();

        userRefreshTokenRepository.save(refreshToken);
        response.addCookie(createCookie("refresh", refresh));

        if(customUser.isSigned()){
            response.sendRedirect("/loading");
        } else {
            response.sendRedirect("/mypage/loading");
        }

    }

    private Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);

        cookie.setMaxAge(30 * 24 * 60 * 60);
        cookie.setSecure(true);
        cookie.setPath("/");
//        cookie.setHttpOnly(true);

        return cookie;
    }

    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        response.sendRedirect("");
    }
}
