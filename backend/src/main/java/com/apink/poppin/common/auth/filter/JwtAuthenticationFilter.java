package com.apink.poppin.common.auth.filter;

import com.apink.poppin.api.manager.dto.ManagerDTO;
import com.apink.poppin.api.manager.entity.Manager;
import com.apink.poppin.api.manager.repository.ManagerRepository;
import com.apink.poppin.api.user.dto.UserDto;
import com.apink.poppin.common.auth.dto.CustomUserDetails;
import com.apink.poppin.common.exception.dto.BusinessLogicException;
import com.apink.poppin.common.exception.dto.ExceptionCode;
import com.apink.poppin.common.oauth.CustomOAuth2User;
import com.apink.poppin.common.util.JwtTokenUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.PrintWriter;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwtTokenUtil;
    private final ManagerRepository managerRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String requestUri = request.getRequestURI();
        if (requestUri.startsWith("/api/auth") || requestUri.startsWith("/oauth")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 헤더에서 access키에 담긴 토큰을 꺼냄
        String accessToken = request.getHeader("Authorization");

        // 토큰이 없다면 다음 필터로 넘김
        if (accessToken == null) {
            filterChain.doFilter(request, response);
            return;
        }

        System.out.println(accessToken);
        accessToken = jwtTokenUtil.extractToken(accessToken);
        System.out.println("extract" + accessToken);

        // 토큰 만료 여부 확인, 만료시 다음 필터로 넘기지 않음
        if(jwtTokenUtil.isExpired(accessToken)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\": \"AccessToken is expired\"}");
            return;
        }

        // 토큰이 access인지 확인 (발급시 페이로드에 명시)
        String category = jwtTokenUtil.getCategory(accessToken);

        // 엑세스 토큰이 아니면 다음 필터로 넘기지 않음
        if (!category.equals("access")) {
            throw new BusinessLogicException(ExceptionCode.ACCESS_TOKEN_ERROR);
        }

        // username, role 값을 획득
        Long username = jwtTokenUtil.getUsername(accessToken);
        String role = jwtTokenUtil.getRole(accessToken);

        if(role.equals("manager")) {
            Manager managerData = managerRepository.findById(String.valueOf(username))
                    .orElseThrow(() -> new BusinessLogicException(ExceptionCode.MANAGER_NOT_FOUND));

            ManagerDTO manager = ManagerDTO.builder()
                    .managerTsid(String.valueOf(managerData.getManagerTsid()))
                    .id(managerData.getId())
                    .role("ROLE_MANAGER")
                    .build();

            CustomUserDetails customUserDetails = new CustomUserDetails(manager);

            Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        else {
            UserDto.Login user = UserDto.Login.builder()
                    .userTsid(username)
                    .role(role)
                    .build();

            CustomOAuth2User customUserDetails = new CustomOAuth2User(user);

            Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }


        filterChain.doFilter(request, response);
    }
}
