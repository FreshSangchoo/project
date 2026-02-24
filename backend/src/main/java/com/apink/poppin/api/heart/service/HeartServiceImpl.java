package com.apink.poppin.api.heart.service;

import com.apink.poppin.api.heart.dto.HeartRequestDTO;
import com.apink.poppin.api.heart.entity.Heart;
import com.apink.poppin.api.heart.repository.HeartRepository;
import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.popup.repository.PopupRepository;
import com.apink.poppin.api.user.entity.User;
import com.apink.poppin.api.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HeartServiceImpl implements HeartService {

    private final HeartRepository heartRepository;
    private final PopupRepository popupRepository;
    private final UserRepository userRepository;


    // 좋아요 추가
    @Transactional
    public void insert(HeartRequestDTO reqDto) throws Exception {
        // 유저 확인
        User user = userRepository.findUserByUserTsid(reqDto.getUserTsid())
                .orElseThrow(() -> new IllegalArgumentException("Invalid user ID"));

        // 팝업 확인
        Popup popup = popupRepository.findById(reqDto.getPopupId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid popup ID"));

        // 이미 좋아요되어있으면 에러 반환
        if (heartRepository.findByUserAndPopup(user, popup).isPresent()){
            throw new Exception("Heart is already exists");
        }

        popup.setHeart(popup.getHeart()+1);

        Heart heart = Heart.builder()
                .popup(popup)
                .user(user)
                .build();

        heartRepository.save(heart);

    }

    // 좋아요 해제
    @Override
    @Transactional
    public void delete(HeartRequestDTO reqDto) throws Exception {
        // 유저 확인
        User user = userRepository.findUserByUserTsid(reqDto.getUserTsid())
                .orElseThrow(() -> new IllegalArgumentException("Invalid user ID"));

        // 팝업 확인
        Popup popup = popupRepository.findById(reqDto.getPopupId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid popup ID"));

        // 좋아요 확인
        Heart heart = heartRepository.findByUserAndPopup(user, popup)
                .orElseThrow(() -> new Exception("Could not found heart id"));

        popup.setHeart(popup.getHeart()-1);

        heartRepository.delete(heart);
    }
}
