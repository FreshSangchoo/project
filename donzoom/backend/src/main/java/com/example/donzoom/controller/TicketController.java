package com.example.donzoom.controller;

import com.example.donzoom.dto.user.response.CoinResponseDto;
import com.example.donzoom.dto.user.response.TicketResponseDto;
import com.example.donzoom.entity.User;
import com.example.donzoom.entity.Wallet;
import com.example.donzoom.service.UserService;
import com.example.donzoom.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ticket")
public class TicketController {

  private final WalletService walletService;
  private final UserService userService;

  @GetMapping
  public ResponseEntity<?> getMyTicket() {
    User loginUser = userService.findCurrentUser();
    return getTicket(loginUser.getId());
  }

  @GetMapping("/{userId}")
  public ResponseEntity<?> getTicket(@PathVariable Long userId) {
    Wallet wallet = walletService.findWalletByUserId(userId);
    Integer ticket = wallet.getTicket();
    return new ResponseEntity<>(TicketResponseDto.builder().ticket(ticket).build(), HttpStatus.OK);
  }


}
