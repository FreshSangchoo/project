package com.example.donzoom.external;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class BankExceptionHandler {

  @ExceptionHandler(BankApiResponseException.class)
  public ResponseEntity<Object> handleApiResponseException(BankApiResponseException ex) {
    // 오류 코드를 포함한 JSON 응답 생성
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
        Map.of("responseCode", ex.getResponseCode(), "responseMessage", ex.getResponseMessage()));
  }
}
