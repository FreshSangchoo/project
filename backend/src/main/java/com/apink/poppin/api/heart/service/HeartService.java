package com.apink.poppin.api.heart.service;

import com.apink.poppin.api.heart.dto.HeartRequestDTO;

public interface HeartService {

    // 좋아요 추가
    void insert(HeartRequestDTO heartRequestDto) throws Exception;

    // 좋아요 해제
    void delete(HeartRequestDTO reqDto) throws Exception;

}
