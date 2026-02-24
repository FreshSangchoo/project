package com.apink.poppin.api.reservation.entity;

import com.apink.poppin.api.popup.entity.Popup;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pre_reservation_info")
public class PreReservationInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long PreReservationInfoId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "popup_id", nullable = false)
    private Popup popup;

    @NotNull
    @Column(name = "pre_reservation_open_at", nullable = false)
    private LocalDateTime preReservationOpenAt;

    @NotNull
    private Integer term;

    @NotNull
    @Column(name = "max_people_per_session", nullable = false)
    private Integer maxPeoplePerSession;

    @NotNull
    @Column(name = "max_reservations_per_person", nullable = false)
    private Integer maxReservationsPerPerson;

    @Lob
    private String warning;



}
