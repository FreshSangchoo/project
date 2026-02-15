package com.example.donzoom.controller;

import com.example.donzoom.dto.account.request.*;
import com.example.donzoom.dto.account.response.BankUserResponseDto;
import com.example.donzoom.dto.account.response.CreateCardResponseDto;
import com.example.donzoom.dto.account.response.GetUserByAccountNoResponseDto;
import com.example.donzoom.dto.alarm.response.AlarmResponseDto;
import com.example.donzoom.entity.Alarm;
import com.example.donzoom.exception.NoUserKeyException;
import com.example.donzoom.service.AccountService;
import com.example.donzoom.service.FCMService;
import com.example.donzoom.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/alarm")
public class AlarmController {

  private final FCMService fcmService;
  private final UserService userService;


  @GetMapping
  public ResponseEntity<?> getTotalAlarms(){
    List<AlarmResponseDto> alarms = fcmService.getAllAlarms(userService.findCurrentUser());
    return new ResponseEntity<>(alarms, HttpStatus.OK);
  }

  @PutMapping("/{alarmId}/{status}")
  public ResponseEntity<?> updateAlarm(@PathVariable("alarmId") Long alarmId, @PathVariable("status") String status){
    fcmService.updateAlarmStatus(alarmId,status);
    return new ResponseEntity<>("성공적으로 상태를 변경했습니다.",HttpStatus.OK);
  }
}
