package com.apink.poppin.api.reservation.entity;

import com.apink.poppin.api.popup.entity.Popup;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
@Entity
@Table(name = "reservation_info")
public class ReservationInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_info_id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "popup_id", nullable = false)
    private Popup popup;

    @NotNull
    @Column(name = "reservation_per_time", nullable = false)
    private Integer reservationPerTime;

    @NotNull
    @Column(name = "reservation_per_person", nullable = false)
    private Integer reservationPerPerson;

    @Lob
    @Column(name = "warning")
    private String warning;

    @NotNull
    @Column(name = "term", nullable = false)
    private Integer term;

}