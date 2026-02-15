package com.example.donzoom.controller;

import com.example.donzoom.dto.account.request.AutoTransferRequestDto;
import com.example.donzoom.dto.account.request.AutoTransferUpdateRequestDto;
import com.example.donzoom.dto.account.request.CreateAccountRequestDto;
import com.example.donzoom.dto.account.request.CreateCardRequestDto;
import com.example.donzoom.dto.account.request.PayRequestDto;
import com.example.donzoom.dto.account.request.TransactionRequestDto;
import com.example.donzoom.dto.account.request.TransferRequestDto;
import com.example.donzoom.dto.account.request.UpdateLimitRequestDto;
import com.example.donzoom.dto.account.request.ValidatePaymentPasswordRequestDto;
import com.example.donzoom.dto.account.response.BankUserResponseDto;
import com.example.donzoom.dto.account.response.CreateCardResponseDto;
import com.example.donzoom.dto.account.response.GetAccountNumberByEmailResponseDto;
import com.example.donzoom.dto.account.response.GetUserByAccountNoResponseDto;
import com.example.donzoom.exception.NoUserKeyException;
import com.example.donzoom.service.AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/account")
public class AccountController {

  //  계좌 생성
  //  fin.create-demand-deposit-account-url=${fin.base-url}/edu/demandDeposit/createDemandDepositAccount
  private final AccountService accountService;

  @PostMapping
  public ResponseEntity<?> createAccount(
      @RequestBody CreateAccountRequestDto createAccountRequestDto) {
    accountService.createDemandDepositAccount(createAccountRequestDto);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  @GetMapping
  public ResponseEntity<?> getAccountInfo() {
    try {
      return ResponseEntity.ok(accountService.getAccountInfo());
    } catch (NoUserKeyException e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  //송금
  @PostMapping("/transfer")
  public ResponseEntity<?> transfer(@RequestBody TransferRequestDto transferRequestDto) {
    try {
      return ResponseEntity.ok(accountService.transfer(transferRequestDto));
    } catch (NoUserKeyException e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  //계좌정보로 유저 조회
  @GetMapping(value = "/holder")
  public ResponseEntity<GetUserByAccountNoResponseDto> getUserByAccountNumber(
      @RequestParam("accountNo") String accountNo) {
    log.info(accountNo);
    GetUserByAccountNoResponseDto response = accountService.getUserByAccountNumber(accountNo);
    return ResponseEntity.ok(response);
  }


  // 이메일로 계좌번호 조회
  @GetMapping(value = "/account-number")
  public ResponseEntity<?> getAccountNumberByEmail(
      @RequestParam("email") String email) {
    log.info("Retrieving account number for email: {}", email);
    try {
      GetAccountNumberByEmailResponseDto response = accountService.getAccountNumberByEmail(email);
      return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
      if (e.getMessage().contains("No account number found")) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
      } else if (e.getMessage().contains("User not found")) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
      } else {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.");
      }
    }
  }

  // 자동이체 설정
  @PostMapping("/transfer/auto")
  public ResponseEntity<Void> setAutoTransfer(@RequestBody AutoTransferRequestDto requestDto) {
    accountService.setAutoTransfer(requestDto);
    return ResponseEntity.noContent().build();
  }

  // 자동이체 수정
  @PatchMapping("/transfer/auto")
  public ResponseEntity<Void> setAutoTransfer(
      @RequestBody AutoTransferUpdateRequestDto requestDto) {
    accountService.updateAutoTransfer(requestDto);
    return ResponseEntity.noContent().build();
  }

  //계좌잔액조회
  @GetMapping(value = "/balance")
  public ResponseEntity<?> getBalance(@RequestParam("accountNo") String accountNo) {
    try {
      return ResponseEntity.ok(accountService.getBalance(accountNo));
    } catch (NoUserKeyException e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  // 거래내역 조회
  @GetMapping(value = "/history")
  public ResponseEntity<?> getHistory(@RequestParam String accountNo,
      @RequestParam String startDate, @RequestParam String endDate,
      @RequestParam String transactionType, @RequestParam String orderByType) {
    try {
      TransactionRequestDto transactionRequestDto = TransactionRequestDto.builder()
          .accountNo(accountNo).startDate(startDate).endDate(endDate)
          .transactionType(transactionType).orderByType(orderByType).build();

      return ResponseEntity.ok(accountService.getHistory(transactionRequestDto));
    } catch (NoUserKeyException e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  //이메일로 계좌잔액조회
  @GetMapping(value = "/balance-email")
  public ResponseEntity<?> getBalanceByEmail(@RequestParam("email") String email) {
    try {
      return ResponseEntity.ok(accountService.getBalanceByEmail(email));
    } catch (NoUserKeyException e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  // 이메일로 거래내역 조회
  @GetMapping(value = "/history-email")
  public ResponseEntity<?> getHistoryByEmail(@RequestParam String accountNo,
      @RequestParam String startDate, @RequestParam String endDate,
      @RequestParam String transactionType, @RequestParam String orderByType
      ,@RequestParam String email) {
    try {
      TransactionRequestDto transactionRequestDto = TransactionRequestDto.builder()
          .accountNo(accountNo).startDate(startDate).endDate(endDate)
          .transactionType(transactionType).orderByType(orderByType).build();

      return ResponseEntity.ok(accountService.getHistoryByEmail(transactionRequestDto,email));
    } catch (NoUserKeyException e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  // 자녀의 1일 결제 한도 수정
  @PutMapping("/daily-limit")
  public ResponseEntity<Void> updateDailyLimit(
      @RequestBody UpdateLimitRequestDto updateLimitRequestDto) {
    accountService.updateDailyLimit(updateLimitRequestDto);
    return ResponseEntity.ok().build();
  }

  // 자녀의 1회 결제 한도 수정
  @PutMapping("/per-transaction-limit")
  public ResponseEntity<Void> updatePerTransactionLimit(
      @RequestBody UpdateLimitRequestDto updateLimitRequestDto) {
    accountService.updatePerTransactionLimit(updateLimitRequestDto);
    return ResponseEntity.ok().build();
  }

  //카드발금
  @PostMapping("/card")
  public ResponseEntity<?> createCard(@RequestBody CreateCardRequestDto createCardRequestDto) {
    try {
      CreateCardResponseDto response = accountService.createCard(createCardRequestDto);
      return ResponseEntity.ok(response);
    } catch (NoUserKeyException e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  //  @PostMapping("/member")
  //  public BankUserResponseDto createMember() {
  //    return accountService.createMember();
  //  }
  //카드발금
  @PostMapping("/payment")
  public ResponseEntity<Void> pay(@RequestBody PayRequestDto payRequestDto) {
    accountService.pay(payRequestDto);
    return ResponseEntity.ok().build();
  }

  @GetMapping("/member")
  public BankUserResponseDto getMember() {
    return accountService.getMember();
  }

  @PostMapping("/check")
  public ResponseEntity<?> validate(
      @RequestBody ValidatePaymentPasswordRequestDto validatePaymentPasswordRequestDto) {
    if (accountService.validatePassword(validatePaymentPasswordRequestDto)) {
      return ResponseEntity.ok().build();
    } else {
      return new ResponseEntity<>("결제 비밀번호가 틀렸습니다.", HttpStatus.UNAUTHORIZED);
    }
  }
}
