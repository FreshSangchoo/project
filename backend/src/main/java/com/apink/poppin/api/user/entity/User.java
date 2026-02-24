package com.apink.poppin.api.user.entity;

import com.apink.poppin.api.heart.entity.Heart;
import com.apink.poppin.api.notice.entity.Token;
import com.apink.poppin.api.popup.entity.Category;
import com.apink.poppin.api.reservation.entity.PreReservation;
import com.apink.poppin.api.review.entity.Comment;
import com.apink.poppin.api.review.entity.Review;
import com.apink.poppin.api.user.dto.UserDto;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.util.List;

@Entity
@Table(name = "user")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @Column(name = "user_tsid")
    private long userTsid;

    @Column(name = "provider_id", nullable = false, unique = true)
    private String providerId;

    @Column(name = "provider_name", nullable = false)
    private String providerName;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String nickname;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String age;

    @Column(nullable = false)
    private String gender;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    @ColumnDefault("'img_url'")
    private String img;

    @Column(nullable = false)
    @ColumnDefault("true")
    private boolean state;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserCategory> userCategories;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Heart> hearts;

    @Setter
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserConsent userConsents;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<PreReservation> preReservations;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Review> reviews;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Comment> comments;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Token> token;

    public void updateUser(UserDto.Put userDto, String img, List<Category> categories) {
        this.nickname = userDto.getNickname();
        if (img != null) {
            this.img = img;
        }

        // 유저 카테고리 바꾸기
        List<UserCategory> userCategories = categories.stream()
                .map(category -> UserCategory.builder()
                        .user(this)
                        .category(category)
                        .build())
                .toList();

        this.userCategories.clear();
        this.userCategories.addAll(userCategories);
    }

}