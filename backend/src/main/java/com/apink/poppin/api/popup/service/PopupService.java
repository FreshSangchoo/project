package com.apink.poppin.api.popup.service;

import com.apink.poppin.api.popup.dto.PopupDTO;
import com.apink.poppin.api.popup.dto.PopupRankingDto;
import com.apink.poppin.api.popup.dto.PopupRequestDTO;
import com.apink.poppin.api.popup.dto.PopupWithPreReservationDTO;
import com.apink.poppin.api.reservation.dto.PreReservationRequestDTO;
import com.apink.poppin.api.reservation.dto.PreReservationResponseDTO;
import com.apink.poppin.api.reservation.dto.PreStatementRequestDTO;
import com.apink.poppin.api.reservation.dto.PreStatementResponseDTO;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

public interface PopupService {

    // 전체 팝업 목록 조회 및 검색
    List<PopupDTO> getPopupList(String keyword);


    // 팝업 상세 조회
    PopupDTO getPopup(Long popupId);

    // 팝업 상세 조회 (+사전예약 정보)
    PopupWithPreReservationDTO getPopupWithPreReservation(Long popupId);

    // 인기 팝업 조회
    List<PopupRankingDto> getPopupRank();

    // 유사 팝업 조회
    List<PopupDTO> getSimilarPopup(long popupId);

    // 오픈 예정 팝업 조회
    List<PopupDTO> getOpenPopup();

    // 사전 예약
    PreReservationResponseDTO createPreReservation(PreReservationRequestDTO req);

    // 날짜 별 사전예약 정보
    List<PreReservationResponseDTO> getPreReservationsByDate(LocalDate reservationDate);

    // 사전 예약 상태 정보 변경하기
    PreStatementResponseDTO changePreReservation(PreStatementRequestDTO reqDto);

    // 팝업 등록 (사전 예약 없이)
    PopupDTO createPopupOnly(PopupRequestDTO popupDto);

    // 팝업 등록 (사전 예약까지)
    void createPopupWithPreReservation(PopupRequestDTO popupDto);

    // 팝업 수정
    PopupDTO updatePopup(PopupRequestDTO popupDto, long popupId);

    // 팝업 삭제
    void deletePopup(long popupId);

    // 본인이 등록한 팝업 전체 조회 (매니저)
    List<PopupDTO> getAllPopupByManager(Long managerTsId);

    // 내 주변 팝업 조회 (전체)
    List<PopupDTO> getAllPopupByLocation();

    // 내 주변 팝업 조회 (좋아요)
    List<PopupDTO> getHeartPopupByLocation();

    // 내 주변 팝업 조회 (내 예약)
    List<PopupDTO> getMyReservationPopup();

    // 사전예약 유무 확인
    boolean checkPreReservation(long popupId);


    List<PopupDTO> getPopupByCategory(int categoryId);

    List<PopupDTO> getRecommendedPopup();
}
