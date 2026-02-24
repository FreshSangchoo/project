package com.apink.poppin.api.popup.repository;

import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.popup.entity.PopupCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PopupCategoryRepository extends JpaRepository<PopupCategory, Long> {
    List<PopupCategory> findByPopup(Popup popup);

    void deleteAllByPopup(Popup popup);
}
