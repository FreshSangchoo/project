package com.apink.poppin.common.auth.repository;

import com.apink.poppin.common.auth.entity.ManagerRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ManagerRefreshTokenRepository extends JpaRepository<ManagerRefreshToken, Long> {

    Boolean existsManagerRefreshTokenByRefresh(String refresh);

    boolean existsUserRefreshTokenByManager_ManagerTsid(long managerTsid);

    ManagerRefreshToken findUserRefreshTokenByManager_ManagerTsid(long managerTsid);

    void deleteManagerRefreshTokenByManager_ManagerTsid(long managerTsid);
}
