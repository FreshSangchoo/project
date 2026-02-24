package com.apink.poppin.api.heart.entity;


import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import static jakarta.persistence.FetchType.LAZY;

@Builder
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Heart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="heart_id")
    private long heartId;

    @ManyToOne(fetch=LAZY)
    @JoinColumn(name = "user_tsid", nullable = false)
    private User user;

    @ManyToOne(fetch=LAZY)
    @JoinColumn(name = "popup_id", nullable = false)
    private Popup popup;


}
