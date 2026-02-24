package com.apink.poppin.common.exception.dto;

import lombok.Getter;

@Getter
public class BusinessLogicException extends RuntimeException {

    private final ExceptionCode code;

    public BusinessLogicException(ExceptionCode code) {
        super(code.getMessage());
        this.code = code;
    }
}
