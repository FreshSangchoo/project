package com.apink.poppin.api.popup.repository;

import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.popup.entity.PopupImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PopupImageRepository extends JpaRepository<PopupImage, Long> {
    List<PopupImage> findAllByPopup_PopupId(Long popupId);

    void deleteAllByPopup(Popup popup);
}
