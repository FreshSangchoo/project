package com.apink.poppin.api.user.repository;

import com.apink.poppin.api.user.entity.User;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByNickname(String nickname);

    Optional<User> findUserByUserTsid(long userTsid);

    User findUserByProviderId(String providerId);

    @Query("SELECT DISTINCT u.userTsid FROM User u JOIN u.userCategories uc JOIN uc.category c WHERE c.id IN :categoryIds")
    List<Long> findUserTsidsByAnyCategoryId(@Param("categoryIds") List<Integer> categoryIds);
}
