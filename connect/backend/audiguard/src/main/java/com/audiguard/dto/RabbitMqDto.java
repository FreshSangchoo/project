package com.audiguard.dto;

import lombok.*;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class RabbitMqDto {
    private String ssaid;
    private String inputText;
    private String outputText;
}