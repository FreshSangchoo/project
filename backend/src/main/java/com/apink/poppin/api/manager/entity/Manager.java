package com.apink.poppin.api.manager.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Entity
@Table(name = "manager")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Manager {
    @Id
    @Column(name = "manager_tsid", nullable = false)
    private Long managerTsid;

    @Size(max = 50)
    @NotNull
    @Column(name = "nickname", nullable = false, length = 50)
    private String nickname;

    @Size(max = 255)
    @NotNull
    @Column(name = "id", nullable = false)
    private String id;

    @Size(max = 255)
    @NotNull
    @Column(name = "password", nullable = false)
    private String password;

    @Size(max = 255)
    @Column(name = "img")
    private String img;

    @NotNull
    @Column(name = "state", nullable = false)
    private Boolean state;
}