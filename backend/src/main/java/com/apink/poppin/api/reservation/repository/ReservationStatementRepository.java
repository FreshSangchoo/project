package com.apink.poppin.api.reservation.repository;

import com.apink.poppin.api.reservation.entity.ReservationStatement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationStatementRepository extends JpaRepository<ReservationStatement, Long> {
}
