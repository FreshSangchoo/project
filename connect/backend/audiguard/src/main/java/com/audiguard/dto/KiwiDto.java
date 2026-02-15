package com.audiguard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
public class KiwiDto {
    private String word;
    private String cg1;
    private byte cg2;
}
