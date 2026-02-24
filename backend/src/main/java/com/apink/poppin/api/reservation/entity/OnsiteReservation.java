package com.apink.poppin.api.reservation.entity;

import com.apink.poppin.api.popup.entity.Popup;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "onsite_reservation")
@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class OnsiteReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long onsiteReservationId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "popup_id", nullable = false)
    private Popup popup;

    @NotNull
    @Column(nullable = false, length = 20)
    private String name;

    @Size(max = 16)
    @NotNull
    @Column(nullable = false, length = 16)
    private String phoneNumber;

    @NotNull
    @Column(nullable = false)
    private LocalDate visitedDate;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_statement_id", nullable = false)
    private ReservationStatement reservationStatement;

    @NotNull
    @Column(name = "reservation_count", nullable = false)
    private Integer reservationCount;

    @NotNull
    @Column(name = "wait_number", nullable = false)
    private Integer waitNumber;

    public void update(ReservationStatement statement) {
        this.reservationStatement = statement;
    }
}