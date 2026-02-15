//package com.audiguard.controller;
//
//import com.audiguard.dto.RabbitMqDto;
//import com.audiguard.service.RabbitMqService;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RestController;
//
//@Slf4j
//@RequiredArgsConstructor
//@RestController
//public class RabbitMqController {
//    private final RabbitMqService rabbitMqService;
//
//    @PostMapping("/send/message")
//    public ResponseEntity<String> sendMessage(@RequestBody RabbitMqDto rabbitMqDto) {
//        rabbitMqService.sendMessage(rabbitMqDto);
//        return ResponseEntity.ok("Message sent to RabbitMQ");
//    }
//}