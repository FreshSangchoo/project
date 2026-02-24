package com.apink.poppin.common.auth.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;

public interface AuthService {

    ResponseEntity<?> reissueToken(HttpServletRequest request, HttpServletResponse response);

    void deleteRefreshToken(long tsid, String role);

}
