package com.apink.poppin.config;

//import com.apink.poppin.api.manager.repository.ManagerRepository;

import com.apink.poppin.api.manager.repository.ManagerRepository;
import com.apink.poppin.common.auth.filter.CustomLogoutFilter;
import com.apink.poppin.common.auth.filter.JwtAuthenticationFilter;
//import com.apink.poppin.common.auth.filter.LoginFilter;
//import com.apink.poppin.common.auth.repository.ManagerRefreshTokenRepository;
import com.apink.poppin.common.auth.filter.LoginFilter;
import com.apink.poppin.common.auth.repository.CustomClientRegistrationRepo;
import com.apink.poppin.common.auth.repository.ManagerRefreshTokenRepository;
import com.apink.poppin.common.auth.service.AuthService;
import com.apink.poppin.common.oauth.CustomOAuth2SuccessHandler;
import com.apink.poppin.common.oauth.CustomOAuth2UserService;
import com.apink.poppin.common.util.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenUtil jwtTokenUtil;
    private final ManagerRepository managerRepository;
    private final AuthService authService;
    private final ManagerRefreshTokenRepository managerRefreshTokenRepository;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;
    private final CustomClientRegistrationRepo customClientRegistrationRepo;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost", "http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Set-Cookie", "Error", "Error-Description"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, AuthenticationConfiguration authenticationConfiguration) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()));

        http
                .csrf((csrf) -> csrf.disable());

        http
                .httpBasic((basic) -> basic.disable());

        http
                .formLogin((form) -> form.disable());

        http
                .authorizeHttpRequests((auth) -> auth
                        .requestMatchers("/login", "/login/**", "/logout").permitAll()
                        .requestMatchers("/api/users/me/**").hasAnyRole("USER", "MANAGER", "ADMIN")
                        .requestMatchers("/api/users/*/check").permitAll()
                        .requestMatchers("/api/users/**").hasRole("USER")
                        .requestMatchers("/api/managers/me/**").hasRole("MANAGER")
                        .requestMatchers("/api/managers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/popups/*/pre-reservations").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/popups/*/onsite-reservations").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/popups/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/popups").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/popups/preReservation").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/popups/**").hasRole("USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/popups/*/pre-reservations/*").hasRole("USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/popups").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/popups/**").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                        .requestMatchers("/api/reviews/**").hasRole("USER")
                        .requestMatchers("/api/onsitereseravations/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/onsitereseravations").hasRole("MANAGER")
                        .requestMatchers("/api/admins/**").hasRole("ADMIN")
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/notice/advertisement").hasRole("ADMIN")
                        .requestMatchers("/ws-stomp/**").permitAll()
                        .anyRequest().authenticated()
                );

        http
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenUtil, managerRepository), LoginFilter.class)
                .addFilterBefore(new CustomLogoutFilter(jwtTokenUtil, authService), LogoutFilter.class)
                .addFilterAt(new LoginFilter(authenticationManager(authenticationConfiguration), jwtTokenUtil, managerRepository, managerRefreshTokenRepository), UsernamePasswordAuthenticationFilter.class);

        http
                .oauth2Login((oauth2) -> oauth2
                        .loginPage(("/login/"))
                        .clientRegistrationRepository(customClientRegistrationRepo.clientRegistrationRepository())
                        .userInfoEndpoint((userInfoEndpointConfig) -> userInfoEndpointConfig
                                .userService(customOAuth2UserService))
                        .successHandler(customOAuth2SuccessHandler)
                );

        http
                .sessionManagement((session) -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

}
