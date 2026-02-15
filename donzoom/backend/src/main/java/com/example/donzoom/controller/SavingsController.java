package com.example.donzoom.controller;

import com.example.donzoom.dto.savings.response.SavingsDataResponseDto;
import com.example.donzoom.dto.savings.response.SavingsDetailResponseDto;
import com.example.donzoom.dto.savings.response.SavingsResponseDto;
import com.example.donzoom.service.SavingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/savings")
@RequiredArgsConstructor
public class SavingsController {

  private final SavingsService savingsService;

  @PostMapping
  public ResponseEntity<String> createSavings(@RequestParam int monthlyDeposit) {
    savingsService.createSavingsAccount(monthlyDeposit);
    return ResponseEntity.ok("Savings account created.");
  }

  @GetMapping
  public ResponseEntity<SavingsDataResponseDto> checkSavingsAccountStatus() {
    SavingsDataResponseDto responseDto = savingsService.checkSavingsAccountStatus();
    return ResponseEntity.ok(responseDto);
  }

  @GetMapping("/early")
  public ResponseEntity<SavingsResponseDto> calculateEarlyTerminationAmount() {
    SavingsResponseDto responseDto = savingsService.calculateEarlyTerminationAmount();
    return ResponseEntity.ok(responseDto);
  }

  @GetMapping("/full")
  public ResponseEntity<SavingsResponseDto> calculateMaturityAmount() {
    SavingsResponseDto responseDto = savingsService.calculateMaturityAmount();
    return ResponseEntity.ok(responseDto);
  }

  @PostMapping("/terminate")
  public ResponseEntity<SavingsResponseDto> terminateSavings() {
    SavingsResponseDto responseDto = savingsService.terminateSavingsAccount();
    return ResponseEntity.ok(responseDto);
  }
  @GetMapping("/detail")
  public ResponseEntity<SavingsDetailResponseDto> getSavingsDetail(@RequestParam Long userId) {
    SavingsDetailResponseDto responseDto = savingsService.getSavingsDetail(userId);
    return ResponseEntity.ok(responseDto);
  }

//
//  @GetMapping("/can-terminate")
//  public ResponseEntity<Boolean> canTerminate() {
//    boolean canTerminate = savingsService.canTerminate();
//    return ResponseEntity.ok(canTerminate);
//  }
}
