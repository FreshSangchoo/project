package com.apink.poppin.api.reservation.entity;

import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;

import static jakarta.persistence.FetchType.LAZY;

@Builder
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="pre_reservation")
public class PreReservation {
    // 사전 예약

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long preReservationId;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_tsid", nullable = false)
    private User user;

    @OneToOne(fetch = LAZY)
    @JoinColumn(name = "popup_id", nullable = false)
    private Popup popup;

    @NotNull
    private LocalDate reservationDate;

    @NotNull
    private LocalTime reservationTime;

    @NotNull
    private int reservationCount;

    @CreationTimestamp
    private LocalDate createdAt;

    @OneToOne(fetch = LAZY)
    @JoinColumn(name = "reservation_statement_id", nullable = false)
    private ReservationStatement reservationStatement;


}
