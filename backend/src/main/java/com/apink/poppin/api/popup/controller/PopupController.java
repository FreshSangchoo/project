package com.apink.poppin.api.popup.controller;


import com.apink.poppin.api.chat.entity.ChatMessage;
import com.apink.poppin.api.chat.service.ChatService;
import com.apink.poppin.api.heart.dto.HeartRequestDTO;
import com.apink.poppin.api.heart.service.HeartService;
import com.apink.poppin.api.popup.dto.PopupDTO;
import com.apink.poppin.api.popup.dto.PopupRankingDto;
import com.apink.poppin.api.popup.dto.PopupRequestDTO;
import com.apink.poppin.api.popup.dto.PopupWithPreReservationDTO;
import com.apink.poppin.api.popup.service.PopupService;
import com.apink.poppin.api.reservation.dto.*;
import com.apink.poppin.api.reservation.service.OnsiteReservationService;
import com.apink.poppin.api.review.dto.ReviewDto;
import com.apink.poppin.api.review.dto.ReviewListDto;
import com.apink.poppin.api.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/popups")
public class PopupController {

    private final PopupService popupService;
    private final HeartService heartService;
    private final ReviewService reviewService;
    private final OnsiteReservationService onsiteReservationService;
    private final ChatService chatService;


    // 팝업 전체 목록 조회 및 검색
    @GetMapping("")
    public ResponseEntity<List<PopupDTO>> getPopupList(@RequestParam(value="keyword", defaultValue="") String keyword) {
        List<PopupDTO> allList = popupService.getPopupList(keyword);
        return new ResponseEntity<>(allList, HttpStatus.OK);
    }

    // 팝업 상세 조회
    @GetMapping("/{popupId}")
    public ResponseEntity<?> getPopup(@PathVariable("popupId") Long popupId) {
        boolean check = popupService.checkPreReservation(popupId);
        if (!check) {
            PopupDTO popup = popupService.getPopup(popupId);
            return new ResponseEntity<>(popup, HttpStatus.OK);
        } else {
            PopupWithPreReservationDTO popup = popupService.getPopupWithPreReservation(popupId);
            return new ResponseEntity<>(popup, HttpStatus.OK);
        }
    }

    // 인기 팝업 조회
    @GetMapping("/rank")
    public ResponseEntity<List<PopupRankingDto>> getPopupRank() {
        List<PopupRankingDto> rankList = popupService.getPopupRank();
        return new ResponseEntity<>(rankList, HttpStatus.OK);
    }

    // 유사 팝업 조회
    @GetMapping("/{popupId}/tag")
    public ResponseEntity<List<PopupDTO>> getSimilarPopup(@PathVariable("popupId") long popupId) {
        List<PopupDTO> similarPopupList = popupService.getSimilarPopup(popupId);
        return ResponseEntity.ok(similarPopupList);
    }

    @GetMapping("/recommendation")
    public ResponseEntity<List<PopupDTO>> getRecommendedPopup() {
        List<PopupDTO> recommendedPopupList = popupService.getRecommendedPopup();
        return ResponseEntity.ok(recommendedPopupList);
    }

    // 오픈 예정 팝업 조회
    @GetMapping("/open")
    public ResponseEntity<List<PopupDTO>> getOpenPopup() {
        List<PopupDTO> openList = popupService.getOpenPopup();
        return new ResponseEntity<>(openList, HttpStatus.OK);
    }

    // 팝업 사전 예약하기
    @PostMapping("/{popupId}/pre-reservations")
    public ResponseEntity<?> createPreReservation(@RequestBody PreReservationRequestDTO req, @PathVariable("popupId") Long popupId) {
        PreReservationResponseDTO responseDTO = popupService.createPreReservation(req);
        return ResponseEntity.ok(responseDTO);
    }

    // 날짜 별 사전 예약자 정보 조회
    @GetMapping("/{popupId}/pre-reservations")
    public ResponseEntity<List<PreReservationResponseDTO>> getPreReservation(@RequestParam("reservationDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reservationDate,
                                                                             @PathVariable("popupId") Long popupId) {
        List<PreReservationResponseDTO> list = popupService.getPreReservationsByDate(reservationDate);
        return new ResponseEntity<>(list, HttpStatus.OK);
    }

    // 사전 예약 상태 정보 변경하기 (매니저가)
    @PutMapping("/{popupId}/pre-reservations/{prereservationId}")
    public ResponseEntity<?> changePreReservationByManager(@RequestBody PreStatementRequestDTO reqDto,
                                                  @PathVariable Long popupId, @PathVariable Long preReservationId) {
        PreStatementResponseDTO resDto = popupService.changePreReservation(reqDto);
        return new ResponseEntity<>(resDto, HttpStatus.OK);
    }

    // 사전 예약 상태 정보 변경하기 (사용자가)
    @DeleteMapping("/{popupId}/pre-reservations/{prereservationId}")
    public ResponseEntity<?> changePreReservationByUser(@RequestBody PreStatementRequestDTO reqDto,
                                                  @PathVariable Long popupId, @PathVariable Long preReservationId) {
        PreStatementResponseDTO resDto = popupService.changePreReservation(reqDto);
        return new ResponseEntity<>(resDto, HttpStatus.OK);
    }


    // 팝업 좋아요
    @PostMapping("/{popupId}/heart")
    public ResponseEntity<String> insertHeart (@RequestBody @Valid HeartRequestDTO reqDto, @PathVariable("popupId") Long popupId) throws Exception {
        heartService.insert(reqDto);
        return new ResponseEntity<>("좋아요 추가 완료", HttpStatus.OK);
    }

    // 팝업 좋아요 해제
    @DeleteMapping("/{popupId}/heart")
    public ResponseEntity<String> deleteHeart (@RequestBody @Valid HeartRequestDTO reqDto, @PathVariable("popupId") Long popupId) throws Exception {
        heartService.delete(reqDto);
        return new ResponseEntity<>("좋아요 해제 완료", HttpStatus.OK);
    }

    @PostMapping("/{popupId}/reviews")
    public ResponseEntity<?> createReview(@PathVariable long popupId, @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail, @RequestPart ReviewDto reviewDto) {
        reviewService.createReview(popupId, reviewDto, thumbnail);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{popupId}/reviews")
    public ResponseEntity<?> getReviews(@PathVariable long popupId) {
        List<ReviewListDto> list = reviewService.getReviewsByPopupId(popupId);
        return ResponseEntity.ok(list);
    }

    // 팝업 등록 (사전 예약 없이)
    @PostMapping("")
    public ResponseEntity<PopupDTO> createPopupOnly(PopupRequestDTO popupDto) {
        PopupDTO popup = popupService.createPopupOnly(popupDto);
        return new ResponseEntity<>(popup, HttpStatus.CREATED);
    }


    // 팝업 등록 (사전 예약까지)
    @PostMapping("/preReservation")
    public ResponseEntity<?> createPopupWithPreReservation(PopupRequestDTO popupDto) {
        popupService.createPopupWithPreReservation(popupDto);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }


    // 팝업 수정
    @PutMapping("{popupId}")
    public ResponseEntity<PopupDTO> updatePopup(PopupRequestDTO popupDto, @PathVariable long popupId) {
        PopupDTO popup = popupService.updatePopup(popupDto, popupId);
        return new ResponseEntity<>(popup, HttpStatus.OK);
    }

    // 매니저가 확인하는 대기 중인 현장 예약 정보
    @GetMapping("/{popupId}/onsite-reservations")
    public ResponseEntity<?> getOnsiteReservations(@PathVariable long popupId) {
        List<OnsiteReservationDto> list = onsiteReservationService.getOnsiteReservations(popupId);

        return ResponseEntity.ok().body(list);
    }

    @DeleteMapping("/{popupId}")
    public ResponseEntity<?> deletePopup(@PathVariable long popupId) {
        popupService.deletePopup(popupId);

        return ResponseEntity.ok().build();
    }


    // 내 주변 팝업 조회 (전체) - 끝난 팝업 제외
    @GetMapping("/map")
    public ResponseEntity<List<PopupDTO>> getAllPopupByLocation() {
        List<PopupDTO> listByLoc = popupService.getAllPopupByLocation();

        return new ResponseEntity<>(listByLoc, HttpStatus.OK);
    }


    // 내 주변 팝업 조회 (좋아요) - 끝난 팝업 제외
    @GetMapping("/map/like")
    public ResponseEntity<List<PopupDTO>> getHeartPopupByLocation() {
        List<PopupDTO> listByHeart = popupService.getHeartPopupByLocation();

        return new ResponseEntity<>(listByHeart, HttpStatus.OK);
    }


    // 내 주변 팝업 조회 (내 예약) - 끝난 팝업 제외
    @GetMapping("/map/reservation")
    public ResponseEntity<List<PopupDTO>> getMyReservationPopup() {
        List<PopupDTO> listByReservation = popupService.getMyReservationPopup();

        return new ResponseEntity<>(listByReservation, HttpStatus.OK);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<?> getPopupByCategory(@PathVariable int categoryId) {
        List<PopupDTO> popupDTOList = popupService.getPopupByCategory(categoryId);

        return ResponseEntity.ok(popupDTOList);
    }

    // 팝업 채팅방 들어가기 - 채팅내역 불러오기
    @GetMapping("/chat/{popupId}")
    public ResponseEntity<List<ChatMessage>> getHistory(@PathVariable Long popupId) {
        List<ChatMessage> chatHistory = chatService.getChatHistory(popupId);
        return new ResponseEntity<>(chatHistory, HttpStatus.OK);
    }


}
