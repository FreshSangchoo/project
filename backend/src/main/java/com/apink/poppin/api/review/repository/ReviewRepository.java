package com.apink.poppin.api.review.repository;

import com.apink.poppin.api.review.entity.Review;
import com.apink.poppin.api.user.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    @EntityGraph(attributePaths = {"comments", "comments.user", "user"}, type = EntityGraph.EntityGraphType.FETCH)
    @NonNull
    Optional<Review> findById(@NonNull Long reviewId);

    @EntityGraph(attributePaths = "user", type = EntityGraph.EntityGraphType.FETCH)
    List<Review> findReviewsByPopup_PopupIdAndDeletedFalse(@NonNull Long popupId);

    @EntityGraph(attributePaths = "user", type = EntityGraph.EntityGraphType.FETCH)
    List<Review> findByUser(User user);

    @EntityGraph(attributePaths = "user", type = EntityGraph.EntityGraphType.FETCH)
    @NonNull
    List<Review> findByDeletedFalse();

    long countByPopup_PopupId(@NonNull Long popupId);
}
