package com.apink.poppin.api.reservation.repository;

import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.reservation.entity.PreReservationInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PreReservationInfoRepository extends JpaRepository<PreReservationInfo, Long> {

    boolean existsByPopup(Popup popup);

    PreReservationInfo findByPopup(Popup popup);
}
