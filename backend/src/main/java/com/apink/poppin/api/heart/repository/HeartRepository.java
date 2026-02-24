package com.apink.poppin.api.heart.repository;
import com.apink.poppin.api.heart.entity.Heart;
import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HeartRepository extends JpaRepository<Heart, Long> {

    // 좋아요 확인
    Optional<Heart> findByUserAndPopup(User user, Popup popup);

    // 유저로 좋아요 검색
    List<Heart> findByUser(User user);

}
