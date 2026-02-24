//package com.apink.poppin.common.exception.controller;
//
//import com.apink.poppin.common.exception.dto.BusinessLogicException;
//import com.apink.poppin.common.exception.dto.ErrorResponse;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.HttpStatusCode;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.ControllerAdvice;
//import org.springframework.web.bind.annotation.ExceptionHandler;
//
//import java.util.NoSuchElementException;
//
//@Slf4j
//@ControllerAdvice
//public class ExceptionController {
//
//    // exception 별로 다른 status code 필요
//
//    @ExceptionHandler(BusinessLogicException.class)
//    public ResponseEntity<ErrorResponse> handleBusinessLogicException(final BusinessLogicException e) {
//        log.error("BusinessLogicException", e);
//
//        ErrorResponse errorResponse = new ErrorResponse(e.getCode());
//
//        return new ResponseEntity<>(errorResponse, HttpStatusCode.valueOf(errorResponse.getStatus()));
//    }
//
//    @ExceptionHandler(Exception.class)
//    public ResponseEntity<?> exception(Exception e) {
//        log.error(e.getMessage());
//        return ResponseEntity.internalServerError().body(e.getMessage());
//    }
//
//    @ExceptionHandler(NoSuchElementException.class)
//    public ResponseEntity<?> exception(NoSuchElementException e) {
//        log.error(e.getMessage());
//        return ResponseEntity.notFound().build();
//    }
//}