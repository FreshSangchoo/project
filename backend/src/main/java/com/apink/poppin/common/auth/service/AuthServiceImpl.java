package com.apink.poppin.common.auth.service;

import com.apink.poppin.api.manager.entity.Manager;
import com.apink.poppin.api.manager.repository.ManagerRepository;
import com.apink.poppin.api.user.entity.User;
import com.apink.poppin.api.user.repository.UserRepository;
import com.apink.poppin.common.auth.entity.ManagerRefreshToken;
import com.apink.poppin.common.auth.entity.UserRefreshToken;
import com.apink.poppin.common.auth.repository.ManagerRefreshTokenRepository;
import com.apink.poppin.common.auth.repository.UserRefreshTokenRepository;
import com.apink.poppin.common.exception.dto.BusinessLogicException;
import com.apink.poppin.common.exception.dto.ExceptionCode;
import com.apink.poppin.common.util.JwtTokenUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRefreshTokenRepository userRefreshTokenRepository;
    private final JwtTokenUtil jwtTokenUtil;
    private final ManagerRefreshTokenRepository managerRefreshTokenRepository;
    private final UserRepository userRepository;
    private final ManagerRepository managerRepository;

    @Override
    @Transactional
    public ResponseEntity<?> reissueToken(HttpServletRequest request, HttpServletResponse response) {
        // 쿠키에서 refresh 토큰 추출
        String refresh = null;
        Cookie[] cookies = request.getCookies();
        for (Cookie cookie : cookies) {
            if (cookie.getName().equals("refresh")) {
                refresh = cookie.getValue();
            }
        }

        // refresh 유무 체크
        if (refresh == null) {
            throw new BusinessLogicException(ExceptionCode.REFRESH_TOKEN_ERROR);
        }

        String role = jwtTokenUtil.getRole(refresh);
        long username = jwtTokenUtil.getUsername(refresh);

        // refresh 만료 체크
        if(jwtTokenUtil.isExpired(refresh)) {
            deleteRefreshToken(username, role);
            throw new BusinessLogicException(ExceptionCode.RT_EXPIRED_ERROR);
        }


        // DB에 저장되어 있는지 확인
        Boolean isExist = false;
        if(role.equals("ROLE_MANAGER")) {
            isExist = managerRefreshTokenRepository.existsManagerRefreshTokenByRefresh(refresh);
        } else {
            isExist = userRefreshTokenRepository.existsUserRefreshTokenByRefresh(refresh);
        }

        if(!isExist) {
            throw new BusinessLogicException(ExceptionCode.REFRESH_TOKEN_ERROR);
        }

        // 토큰이 refresh인지 확인 (발급시 페이로드에 명시)
        String category = jwtTokenUtil.getCategory(refresh);
        if (!category.equals("refresh")) {
            throw new BusinessLogicException(ExceptionCode.REFRESH_TOKEN_ERROR);
        }


        //make new JWT
        String newAccess = jwtTokenUtil.createToken("access", username, role, 60 * 1000L);
        String newRefresh = jwtTokenUtil.createToken("refresh", username, role, 30 * 60 * 60 * 24 * 1000L);

        if(role.equals("ROLE_MANAGER")) {
            ManagerRefreshToken token = ManagerRefreshToken.builder()
                    .manager(findManagerrByManagerTsid(username))
                    .refresh(newRefresh)
                    .build();
        } else {
            // refreshToken 갱신
            UserRefreshToken token = UserRefreshToken.builder()
                    .user(findUserByUserTsid(username))
                    .refresh(newRefresh)
                    .build();
        }
//        deleteRefreshToken(username, role);
//        userRefreshTokenRepository.save(token);

//        response.addCookie(createCookie("refresh", newRefresh));
        response.setHeader("Authorization", "Bearer " + newAccess);

        return new ResponseEntity<>(HttpStatus.OK);
    }


    @Override
    @Transactional
    public void deleteRefreshToken(long tsid, String role) {
        if ("ROLE_MANAGER".equals(role)) {
            managerRefreshTokenRepository.deleteManagerRefreshTokenByManager_ManagerTsid(tsid);
        } else {
            userRefreshTokenRepository.deleteUserRefreshTokenByUser_UserTsid(tsid);
        }
    }

    private User findUserByUserTsid(long userTsid) {
        Optional<User> user = userRepository.findUserByUserTsid(userTsid);
        return user
                .orElseThrow(() -> new BusinessLogicException(ExceptionCode.USER_NOT_FOUND));
    }

    private Manager findManagerrByManagerTsid(long managerTsid) {
        Optional<Manager> manager = managerRepository.findByManagerTsid(managerTsid);
        return manager
                .orElseThrow(() -> new BusinessLogicException(ExceptionCode.MANAGER_NOT_FOUND));
    }

    private Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);

        cookie.setMaxAge(30 * 24 * 60 * 60);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setHttpOnly(true);

        return cookie;
    }

}
