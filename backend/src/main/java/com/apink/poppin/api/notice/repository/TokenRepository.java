package com.apink.poppin.api.notice.repository;

import com.apink.poppin.api.notice.entity.Token;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {

    @Query("SELECT t.userToken FROM Token t JOIN t.user u JOIN u.userConsents uc WHERE u.userTsid IN :userTsids AND uc.servicePushConsent = true")
    List<String> findUserTokensByUserTsidsAndServicePushConsent(@Param("userTsids") List<Long> userTsids);

    @Query("SELECT t.userToken FROM Token t JOIN t.user u JOIN u.userConsents uc WHERE uc.marketingConsent = true")
    List<String> findUserTokensByUserTsidsAndAdverTisementPushConsent();


}
