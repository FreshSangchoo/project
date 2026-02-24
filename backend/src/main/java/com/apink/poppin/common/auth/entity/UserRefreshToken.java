package com.apink.poppin.common.auth.entity;

import com.apink.poppin.api.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long refreshTokenId;

    @Column(nullable = false, unique = true)
    private String refresh;

    @OneToOne
    @JoinColumn(name = "user_tsid")
    private User user;

}
