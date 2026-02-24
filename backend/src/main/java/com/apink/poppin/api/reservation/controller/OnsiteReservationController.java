package com.apink.poppin.api.reservation.controller;

import com.apink.poppin.api.reservation.dto.OnsiteReservationDto;
import com.apink.poppin.api.reservation.dto.OnsiteReservationRedisDto;
import com.apink.poppin.api.reservation.dto.OnsiteReservationRequestDto;
import com.apink.poppin.api.reservation.dto.OnsiteReservationWaitingDto;
import com.apink.poppin.api.reservation.service.OnsiteReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/onsite-reservations")
@RequiredArgsConstructor
public class OnsiteReservationController {

    private final OnsiteReservationService onsiteReservationService;

    @PostMapping
    public ResponseEntity<?> createOnsiteReservation(@RequestBody OnsiteReservationDto onsiteReservationDto) {
        OnsiteReservationRedisDto completed = onsiteReservationService.createOnsiteReservation(onsiteReservationDto);
        OnsiteReservationDto response = onsiteReservationService.calculateRank(completed);

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/{onsiteReservationId}/popups/{popupId}")
    public ResponseEntity<?> getOnsiteReservationByKakaoLink(@PathVariable Long onsiteReservationId, @PathVariable Long popupId) {
        OnsiteReservationWaitingDto onsite = onsiteReservationService.getOnsiteReservationByKakaoLink(onsiteReservationId, popupId);

        return ResponseEntity.ok(onsite);
    }

    @GetMapping("/{phoneNumber}")
    public ResponseEntity<?> getOnsiteReservationByPhoneNumber(@PathVariable String phoneNumber) {
        OnsiteReservationWaitingDto onsiteReservationDto = onsiteReservationService.getOnsiteReservationByPhoneNumber(phoneNumber);

        return ResponseEntity.ok().body(onsiteReservationDto);
    }

    @PutMapping
    public ResponseEntity<?> changeOnsiteReservation(@RequestBody OnsiteReservationRequestDto onsiteReservationRequestDto) {
        OnsiteReservationDto onsiteReservationDto = onsiteReservationService.changeOnsiteReservation(onsiteReservationRequestDto);

        return ResponseEntity.ok().body(onsiteReservationDto);
    }

    @DeleteMapping
    public ResponseEntity<?> cancelOnsiteReservationByUser(@RequestBody OnsiteReservationRequestDto onsiteReservationRequestDto) {
        OnsiteReservationDto onsiteReservationDto = onsiteReservationService.changeOnsiteReservation(onsiteReservationRequestDto);

        return ResponseEntity.ok().body(onsiteReservationDto);
    }
}
