package com.apink.poppin.common.auth.filter;

import com.apink.poppin.api.manager.entity.Manager;
import com.apink.poppin.api.manager.repository.ManagerRepository;
import com.apink.poppin.common.auth.dto.CustomUserDetails;
import com.apink.poppin.common.auth.entity.ManagerRefreshToken;
import com.apink.poppin.common.auth.repository.ManagerRefreshTokenRepository;
import com.apink.poppin.common.exception.dto.BusinessLogicException;
import com.apink.poppin.common.exception.dto.ExceptionCode;
import com.apink.poppin.common.util.JwtTokenUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.Iterator;

public class LoginFilter extends UsernamePasswordAuthenticationFilter {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final ManagerRepository managerRepository;
    private final ManagerRefreshTokenRepository managerRefreshTokenRepository;

    public LoginFilter(AuthenticationManager authenticationManager, JwtTokenUtil jwtTokenUtil
            , ManagerRepository managerRepository, ManagerRefreshTokenRepository managerRefreshTokenRepository) {
        super.setFilterProcessesUrl("/login/manager");
        this.authenticationManager = authenticationManager;
        this.jwtTokenUtil = jwtTokenUtil;
        this.managerRepository = managerRepository;
        this.managerRefreshTokenRepository = managerRefreshTokenRepository;
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {

        String managerId = request.getParameter("id");
        String password = request.getParameter("password");
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(managerId, password, null);

        return authenticationManager.authenticate(authToken);
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authentication) throws IOException, ServletException {

        CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();

        long managerTsid = Long.parseLong(customUserDetails.getUserTsid());

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
        GrantedAuthority auth = iterator.next();
        String role = auth.getAuthority();

        String access = jwtTokenUtil.createToken("Authorization", managerTsid, role, 60 * 60 * 1000L);
        String refresh = null;

        if(managerRefreshTokenRepository.existsUserRefreshTokenByManager_ManagerTsid(managerTsid)){
            String refreshToken = managerRefreshTokenRepository.findUserRefreshTokenByManager_ManagerTsid(managerTsid).getRefresh();
            if(!jwtTokenUtil.isExpired(refreshToken)) {
                refresh = refreshToken;
                response.addHeader("Authorization", "Bearer " + access);
                response.addCookie(createCookie("refresh", refresh));
                return;
            } else {
                managerRefreshTokenRepository.deleteManagerRefreshTokenByManager_ManagerTsid(managerTsid);
            }
        }

        refresh = jwtTokenUtil.createToken("refresh", managerTsid, role, 30 * 60 * 60 * 24 * 1000L);

        Manager manager = managerRepository.findByManagerTsid(managerTsid)
                .orElseThrow(() -> new BusinessLogicException(ExceptionCode.MANAGER_NOT_FOUND));

        ManagerRefreshToken saveRefresh = ManagerRefreshToken.builder()
                .refresh(refresh)
                .manager(manager)
                .build();

        managerRefreshTokenRepository.save(saveRefresh);

        response.addHeader("Authorization", "Bearer " + access);
        response.addCookie(createCookie("refresh", refresh));
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response, AuthenticationException failed) throws IOException, ServletException {
        response.setStatus(401);
    }

    private Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);

        // 살아 있는 시간
        cookie.setMaxAge(30 * 24 * 60 * 60);
        cookie.setSecure(true);
        cookie.setPath("/");
//        cookie.setHttpOnly(true);

        return cookie;
    }
}
