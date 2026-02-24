package com.apink.poppin.api.user.repository;

import com.apink.poppin.api.user.entity.User;
import com.apink.poppin.api.user.entity.UserCategory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserCategoryRepository extends JpaRepository<UserCategory, Long> {

    @EntityGraph(attributePaths = {"category"}, type = EntityGraph.EntityGraphType.FETCH)
    List<UserCategory> findByUser(User user);
}
