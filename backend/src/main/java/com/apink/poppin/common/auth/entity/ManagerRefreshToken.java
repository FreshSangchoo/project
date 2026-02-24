package com.apink.poppin.common.auth.entity;

import com.apink.poppin.api.manager.entity.Manager;
import com.apink.poppin.api.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerRefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long refreshTokenId;

    @Column(nullable = false, unique = true)
    private String refresh;

    @OneToOne
    @JoinColumn(name = "manager_tsid")
    private Manager manager;

}
