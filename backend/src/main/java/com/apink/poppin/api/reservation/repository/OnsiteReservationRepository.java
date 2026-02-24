package com.apink.poppin.api.reservation.repository;

import com.apink.poppin.api.reservation.dto.ReservationResponseDto;
import com.apink.poppin.api.reservation.entity.OnsiteReservation;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnsiteReservationRepository extends JpaRepository<OnsiteReservation, Long> {

    @EntityGraph(attributePaths = {"reservationStatement"}, type = EntityGraph.EntityGraphType.FETCH)
    @NonNull
    Optional<OnsiteReservation> findById(@NonNull Long id);

    @Query("SELECT new com.apink.poppin.api.reservation.dto.ReservationResponseDto(" +
            "r.onsiteReservationId, r.name, p.popupId, p.name, pi.img, r.visitedDate," +
            "r.reservationCount, rs.reservationStatementId) " +
            "FROM OnsiteReservation r " +
            "JOIN r.popup p " +
            "JOIN r.reservationStatement rs " +
            "LEFT JOIN PopupImage pi ON pi.popup.popupId = p.popupId AND pi.seq = 1 " +
            "WHERE r.phoneNumber = :phoneNumber AND rs.reservationStatementId = 2")
    List<ReservationResponseDto> findReservationsByPhoneNumber(@Param("phoneNumber") String phoneNumber);

    // 전화번호로 예약목록 찾기
    List<OnsiteReservation> findAllByPhoneNumber(String phoneNumber);
}
