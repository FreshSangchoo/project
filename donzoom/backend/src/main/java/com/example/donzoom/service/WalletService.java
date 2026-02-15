package com.example.donzoom.service;

import com.example.donzoom.dto.ticket.response.BuyTicketResponseDto;
import com.example.donzoom.entity.User;
import com.example.donzoom.entity.Wallet;
import com.example.donzoom.repository.UserRepository;
import com.example.donzoom.repository.WalletRepository;
import com.google.firebase.messaging.FirebaseMessagingException;
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@RequiredArgsConstructor
@Service
public class WalletService {

  private final WalletRepository walletRepository;
  private final UserRepository userRepository;
  private final UserService userService;
  private final FCMService fcmService;
  @Value("${ticketPrice}")
  private int ticketPrice;

  public Wallet findWalletByUserId(Long userId) {
    return walletRepository.findByUserId(userId)
        .orElseThrow(() -> new NoSuchElementException("지갑을 찾을 수 없습니다."));
  }

  public Wallet findCurrentWallet() {
    User user = userService.findCurrentUser();
    return user.getWallet();
  }

  public Integer getCurrentUserCoin() {
    Wallet wallet = findCurrentWallet();
    return wallet.getCoin();
  }

  public void updateCoin(Integer amount) {
    Wallet wallet = findCurrentWallet();
    wallet.updateCoin(wallet.getCoin() + amount);
    walletRepository.save(wallet);
  }

  //가상머니로 돼지뽑기권 구매하기
  public BuyTicketResponseDto buyTicket(String count) {

    int amount = Integer.parseInt(count);
    int totalPrice = amount * ticketPrice;

    // user에서  지갑 가져오기
    User user = userService.findCurrentUser();
    Long walletId = user.getWallet().getId();

    // 지갑을 ID로 조회
    Wallet wallet = walletRepository.findById(walletId)
        .orElseThrow(() -> new IllegalArgumentException("해당 id를 가진 지갑을 찾을 수 없음: " + walletId));

    // 지갑의 코인 확인 후 충분한지 검사
    if (wallet.getCoin() < totalPrice) {
      throw new IllegalArgumentException("티켓을 살만큼 코인이 없어요");
    }

    // 코인 차감 및 티켓 추가
    wallet.updateCoin(wallet.getCoin() - totalPrice);
    wallet.updateTicket(wallet.getTicket() + amount);

    // 변경된 지갑 정보를 저장
    walletRepository.save(wallet);

    return BuyTicketResponseDto.builder().lastTicket(wallet.getTicket()).lastCoin(wallet.getCoin()).build();
  }


}
