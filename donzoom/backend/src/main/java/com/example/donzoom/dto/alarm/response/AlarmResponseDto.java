package com.example.donzoom.dto.alarm.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AlarmResponseDto {

    private final Long id;

    private final String title;

    private final String body;

    private final String status;

    private final String type;

    private final LocalDateTime createdAt;
}
