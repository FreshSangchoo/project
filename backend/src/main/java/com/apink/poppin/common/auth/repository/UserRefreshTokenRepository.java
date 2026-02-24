package com.apink.poppin.common.auth.repository;

import com.apink.poppin.common.auth.entity.UserRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRefreshTokenRepository extends JpaRepository<UserRefreshToken, Long> {


    Boolean existsUserRefreshTokenByRefresh(String refresh);

    boolean existsUserRefreshTokenByUser_UserTsid(long userTsid);

    UserRefreshToken findUserRefreshTokenByUser_UserTsid(long userTsid);

    void deleteUserRefreshTokenByUser_UserTsid(long userTsid);
}
