package com.apink.poppin.api.popup.repository;

import com.apink.poppin.api.manager.entity.Manager;
import com.apink.poppin.api.popup.dto.ReviewRecommendationDto;
import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.reservation.dto.ReservationResponseDto;
import io.lettuce.core.dynamic.annotation.Param;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PopupRepository extends JpaRepository<Popup, Long> {

    // 전체 목록 조회 및 검색
    List<Popup> findAllByNameContaining(String keyword);

    // 인기 팝업 조회
    List<Popup> findAllByOrderByHeartDesc();

    // 오픈 예정 팝업 조회
    List<Popup> findAllByStartDateAfter(LocalDate now);

    @Query("SELECT new com.apink.poppin.api.reservation.dto.ReservationResponseDto(" +
            "p.popupId, p.name, pi.img) " +
            "FROM Popup p " +
            "LEFT JOIN PopupImage pi ON pi.popup.popupId = p.popupId AND pi.seq = 1 " +
            "WHERE p.popupId = :popupId")
    ReservationResponseDto findPopupNameAndFirstImageByPopupId(@Param("popupId") Long popupId);

    // 본인이 등록한 팝업 목록 조회 (매니저)
    List<Popup> findAllByManager(Manager manager);

    // 끝난 팝업 제외한 전체 팝업 가져 오기
    List<Popup> findAllByEndDateAfter(LocalDate now);


    // 종료 되지 않은 팝업 조회
    List<Popup> findByEndDateGreaterThanEqualAndDeletedFalse(@NotNull LocalDate endDate);

    @Query("SELECT p FROM Popup p " +
            "JOIN PopupCategory pc ON p.popupId = pc.popup.popupId " +
            "JOIN Category c ON pc.category.id = c.id " +
            "WHERE c.id = :categoryId")
    List<Popup> findPopupsByCategoryName(@Param("categoryId") int categoryId);

    @Query("SELECT p FROM Popup p WHERE p.popupId IN (SELECT pr.popup.popupId FROM PreReservation pr WHERE pr.user.userTsid = :userTsid AND pr.reservationStatement.reservationStatementId = 2)")
    List<Popup> findReservedPopupByUserTsid(@Param("userTsid") long userTsid);

    @Query("SELECT p FROM Popup p WHERE p.popupId IN (SELECT h.popup.popupId FROM Heart h WHERE h.user.userTsid = :userTsid)")
    List<Popup> findHeartedPopupsByUserTsid(@Param("userTsid") long userTsid);

    @Query("SELECT new com.apink.poppin.api.popup.dto.ReviewRecommendationDto(p.popupId, p.name, p.content, r.title, r.content) " +
            "FROM Popup p " +
            "JOIN Review r ON p.popupId = r.popup.popupId " +
            "WHERE r.user.userTsid = :userTsid")
    List<ReviewRecommendationDto> findRecommendedReviewsByUserTsid(@Param("userTsid") long userTsid);

    List<Popup> findTop10ByOrderByStartDateDesc();

}
