package com.example.donzoom.external;

import com.example.donzoom.dto.account.request.CreateCardRequestDto;
import com.example.donzoom.dto.account.request.CreateMemberDto;
import com.example.donzoom.dto.account.request.TransactionRequestDto;
import com.example.donzoom.dto.account.request.TransferRequestDto;
import com.example.donzoom.dto.account.response.AccountCreateResponseDto;
import com.example.donzoom.dto.account.response.AccountResponseDto;
import com.example.donzoom.dto.account.response.BalanceResponseDto;
import com.example.donzoom.dto.account.response.BankUserResponseDto;
import com.example.donzoom.dto.account.response.CardListResponseDto;
import com.example.donzoom.dto.account.response.CreateCardResponseDto;
import com.example.donzoom.dto.account.response.TransactionResponseDto;
import com.example.donzoom.dto.account.response.TransferResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Random;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
public class BankApi {

  private static final Random random = new Random();
  private final WebClient webClient;
  @Value("${fin.api-key}")
  private String apiKey;
  @Value("${fin.base-url}")
  private String baseUrl;
  @Value("${fin.create-demand-deposit-account-url}")
  private String createAccountUrl;
  @Value("${fin.inquire-demand-deposit-account-list-url}")
  private String getAccountUrl;
  @Value("${fin.generate-user-key-url}")
  private String createMemberUrl;
  @Value("${fin.user-info-url}")
  private String userInfoUrl;
  @Value("${fin.update-demand-deposit-account-transfer-url}")
  private String transferUrl;
  @Value("${fin.inquire-demand-deposit-account-balance-url}")
  private String getBalanceUrl;
  @Value("${fin.inquire-transaction-history-list-url}")
  private String getTransactionUrl;
  @Value("${fin.create-credit-card-url}")
  private String createCarUrl;
  @Value("${fin.inquire-sign-up-credit-card-list}")
  private String getCardListUrl;
  @Value("${fin.update-demand-deposit-account-withdrawal-url}")
  private String withdrawalUrl;
  @Value("${fin.inquire-demand-deposit-account-holder-url}")
  private String getUserNameUrl;

  public BankApi() {
    this.webClient = WebClient.builder()
        .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE).build();
  }

  public static String generateUniqueNumber() {
    // 현재 날짜와 시간 얻기
    LocalDateTime now = LocalDateTime.now();
    DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd");
    DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HHmmss");

    // 날짜와 시간 문자열 생성
    String date = now.format(dateFormatter);
    String time = now.format(timeFormatter);

    // 일련번호 6자리 생성
    String serialNumber = String.format("%06d", random.nextInt(1000000));
    log.info(date + time + serialNumber);
    // 최종 채번 생성
    return date + time + serialNumber;
  }

  public static String getDate() {
    // 현재 날짜와 시간 얻기
    LocalDateTime now = LocalDateTime.now();
    DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd");

    return now.format(dateFormatter);

  }

  public static String getTime() {
    // 현재 날짜와 시간 얻기
    LocalDateTime now = LocalDateTime.now();
    DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HHmmss");

    return now.format(timeFormatter);

  }

  //회원생성
  public BankUserResponseDto createMember(String userId) {
    log.info("싸피은행에 멤버를 생성하는 CREATEMEMBER");
    log.info(userId + "userid");
    CreateMemberDto member = CreateMemberDto.builder().apiKey(apiKey).userId(userId).build();

    try {
      // 회원 생성 시도
      log.info("회원 가입 시도");
      return webClient.post().uri(createMemberUrl).bodyValue(member).retrieve()
          .bodyToMono(BankUserResponseDto.class).block();  // 동기식으로 블록 처리

    } catch (WebClientResponseException e) {
      // 서버에서 HTTP 상태 코드 4xx 또는 5xx로 응답한 경우 처리
      if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
        // 에러 메시지를 파싱하여 이미 존재하는 회원일 경우 처리
        try {
          ObjectMapper objectMapper = new ObjectMapper();
          JsonNode errorJson = objectMapper.readTree(e.getResponseBodyAsString());
          String responseCode = errorJson.get("responseCode").asText();

          if ("E4002".equals(responseCode)) {
            log.info("이미 존재하는 회원입니다.(이미 가입된 정보 return)");
            // 이미 존재하는 회원일 때 getMember를 호출하여 처리
            return getMember(userId);
          }
        } catch (Exception parseException) {
          throw new RuntimeException("에러 메시지 파싱 중 오류가 발생했습니다.", parseException);
        }
      }

      // 그 외의 경우는 일반 예외 처리
      throw new RuntimeException("회원 생성 중 오류가 발생했습니다.", e);

    } catch (Exception e) {
      // 그 외의 모든 예외 처리
      throw new RuntimeException("회원 생성 중 서버 오류가 발생했습니다.", e);
    }
  }

  public BankUserResponseDto getMember(String userId) {
    log.info(userId);
    CreateMemberDto member = CreateMemberDto.builder().apiKey(apiKey).userId(userId).build();
    try {
      // 회원 생성 시도
      log.info("회원 가입 시도");
      return webClient.post().uri(userInfoUrl).bodyValue(member).retrieve()
          .bodyToMono(BankUserResponseDto.class).block();  // 동기식으로 블록 처리

    } catch (WebClientResponseException e) {
      // 서버에서 HTTP 상태 코드 4xx 또는 5xx로 응답한 경우 처리
      if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
        // 에러 메시지를 파싱
        try {
          ObjectMapper objectMapper = new ObjectMapper();
          JsonNode errorJson = objectMapper.readTree(e.getResponseBodyAsString());
          String responseCode = errorJson.get("responseCode").asText();
          log.error(responseCode);
        } catch (Exception ne) {
          log.error(ne.getMessage());
        }
      }

      // 그 외의 경우는 일반 예외 처리
      throw new RuntimeException("회원 생성 중 오류가 발생했습니다.", e);

    } catch (Exception e) {
      // 그 외의 모든 예외 처리
      throw new RuntimeException("회원 생성 중 서버 오류가 발생했습니다.", e);
    }
  }

  //  //계좌번호로 계좌정보와 예금주 조회
  //  public AccountHolderResponseDto getUserAccountData(GetUserDataRequestDto dto, String userKey) {
  //    // 요청 본문 구성
  //    log.info(dto.getAccountNo());
  //    Map<String, Object> requestBody = Map.of("Header",
  //        Map.of("apiName", "inquireDemandDepositAccountHolderName", "transmissionDate", getDate(),
  //            "transmissionTime", getTime(), "institutionCode", "00100", "fintechAppNo", "001",
  //            "apiServiceCode", "inquireDemandDepositAccountHolderName", "institutionTransactionUniqueNo",
  //            generateUniqueNumber(), "apiKey", apiKey, "userKey", userKey)
  //        , "accountNo", dto.getAccountNo()
  //    );
  //    return webClient.post().uri(getUserNameUrl).bodyValue(requestBody).retrieve()
  //        .bodyToMono(AccountHolderResponseDto.class).block();
  //  }

  //계좌 생성
  public AccountCreateResponseDto createDemandDepositAccount(String accountTypeUniqueNo,
      String userKey) {
    // 요청 본문 구성
    Map<String, Object> requestBody = Map.of("Header",
        Map.of("apiName", "createDemandDepositAccount", "transmissionDate", getDate(),
            "transmissionTime", getTime(), "institutionCode", "00100", "fintechAppNo", "001",
            "apiServiceCode", "createDemandDepositAccount", "institutionTransactionUniqueNo",
            generateUniqueNumber(), "apiKey", apiKey, "userKey", userKey), "accountTypeUniqueNo",
        "001-1-c468f2dd7ccb42" //상품번호. 일단 임의로해놓음
    );

    return webClient.post().uri(createAccountUrl).bodyValue(requestBody).retrieve()
        .bodyToMono(AccountCreateResponseDto.class).block();
  }

  public AccountResponseDto getAccountInfo(String userKey) {
    // 요청 본문 구성
    Map<String, Object> requestBody = Map.of("Header",
        Map.of("apiName", "inquireDemandDepositAccountList", "transmissionDate", getDate(),
            "transmissionTime", getTime(), "institutionCode", "00100", "fintechAppNo", "001",
            "apiServiceCode", "inquireDemandDepositAccountList", "institutionTransactionUniqueNo",
            generateUniqueNumber(), "apiKey", apiKey, "userKey", userKey)

    );

    return webClient.post().uri(getAccountUrl).bodyValue(requestBody).retrieve()
        .bodyToMono(AccountResponseDto.class).block();
  }

  public TransferResponseDto transfer(TransferRequestDto transferRequestDto, String userKey) {
    // 요청 본문 구성
    Map<String, Object> requestBody = Map.of("Header",
        Map.of("apiName", "updateDemandDepositAccountTransfer", "transmissionDate", getDate(),
            "transmissionTime", getTime(), "institutionCode", "00100", "fintechAppNo", "001",
            "apiServiceCode", "updateDemandDepositAccountTransfer",
            "institutionTransactionUniqueNo", generateUniqueNumber(), "apiKey", apiKey, "userKey",
            userKey), "depositAccountNo", transferRequestDto.getDepositAccountNo(),
        "depositTransactionSummary", transferRequestDto.getDepositTransactionSummary(),
        "transactionBalance", transferRequestDto.getTransactionBalance(), "withdrawalAccountNo",
        transferRequestDto.getWithdrawalAccountNo(), "withdrawalTransactionSummary",
        transferRequestDto.getDepositTransactionSummary());

    return webClient.post().uri(transferUrl).bodyValue(requestBody).retrieve()
        .bodyToMono(TransferResponseDto.class).block();
  }

  public BalanceResponseDto getBalance(String accountNo, String userKey) {
    // 요청 본문 구성
    Map<String, Object> requestBody = Map.of("Header",
        Map.of("apiName", "inquireDemandDepositAccountBalance", "transmissionDate", getDate(),
            "transmissionTime", getTime(), "institutionCode", "00100", "fintechAppNo", "001",
            "apiServiceCode", "inquireDemandDepositAccountBalance",
            "institutionTransactionUniqueNo", generateUniqueNumber(), "apiKey", apiKey, "userKey",
            userKey), "accountNo", accountNo

    );

    return webClient.post().uri(getBalanceUrl).bodyValue(requestBody).retrieve()
        .bodyToMono(BalanceResponseDto.class).block();
  }

  public TransactionResponseDto getHistory(TransactionRequestDto transactionRequestDto,
      String userKey) {
    // 요청 본문 구성
    Map<String, Object> requestBody = Map.of("Header",
        Map.of("apiName", "inquireTransactionHistoryList", "transmissionDate", getDate(),
            "transmissionTime", getTime(), "institutionCode", "00100", "fintechAppNo", "001",
            "apiServiceCode", "inquireTransactionHistoryList", "institutionTransactionUniqueNo",
            generateUniqueNumber(), "apiKey", apiKey, "userKey", userKey), "accountNo",
        transactionRequestDto.getAccountNo(), "startDate", transactionRequestDto.getStartDate(),
        "endDate", transactionRequestDto.getEndDate(), "transactionType",
        transactionRequestDto.getTransactionType(), "orderByType",
        transactionRequestDto.getOrderByType());

    return webClient.post().uri(getTransactionUrl).bodyValue(requestBody).retrieve()
        .bodyToMono(TransactionResponseDto.class).block();
  }

  public CreateCardResponseDto createCard(CreateCardRequestDto createCardRequestDto,
      String userKey) {
    // 요청 본문 구성
    Map<String, Object> requestBody = Map.of("Header",
        Map.of("apiName", "createCreditCard", "transmissionDate", getDate(), "transmissionTime",
            getTime(), "institutionCode", "00100", "fintechAppNo", "001", "apiServiceCode",
            "createCreditCard", "institutionTransactionUniqueNo", generateUniqueNumber(), "apiKey",
            apiKey, "userKey", userKey), "cardUniqueNo", createCardRequestDto.getCardUniqueNo(),
        "withdrawalAccountNo", createCardRequestDto.getWithdrawalAccountNo(), "withdrawalDate",
        createCardRequestDto.getWithdrawalDate());

    return webClient.post().uri(createCarUrl).bodyValue(requestBody).retrieve()
        .bodyToMono(CreateCardResponseDto.class).block();
  }

  public CardListResponseDto getMyCards(String userKey) {
    Map<String, Object> requestBody = Map.of("Header",
        Map.of("apiName", "inquireSignUpCreditCardList", "transmissionDate", getDate(),
            "transmissionTime", getTime(), "institutionCode", "00100", "fintechAppNo", "001",
            "apiServiceCode", "inquireSignUpCreditCardList", "institutionTransactionUniqueNo",
            generateUniqueNumber(), "apiKey", apiKey, "userKey", userKey));

    return webClient.post().uri(getCardListUrl).bodyValue(requestBody).retrieve()
        .bodyToMono(CardListResponseDto.class).block();
  }

  public void withdrawal(String accountNo, Long transactionBalance, String transactionSummary,
      String userKey) {
    log.info(accountNo + " " + transactionSummary + " " + transactionBalance);

    // 직접 헤더 생성
    Map<String, Object> header = Map.of("apiName", "updateDemandDepositAccountWithdrawal",
        "transmissionDate", getDate(), "transmissionTime", getTime(), "institutionCode", "00100",
        "fintechAppNo", "001", "apiServiceCode", "updateDemandDepositAccountWithdrawal",
        "institutionTransactionUniqueNo", generateUniqueNumber(), "apiKey", apiKey, "userKey",
        userKey);

    // 요청 본문 생성
    Map<String, Object> requestBody = Map.of("Header", header, "accountNo", accountNo,
        "transactionBalance", transactionBalance, "transactionSummary", transactionSummary);

    // API 호출
    webClient.post().uri(withdrawalUrl).bodyValue(requestBody).retrieve().bodyToMono(String.class)
        .doOnError(error -> log.error("Error occurred during withdrawal: {}", error.toString()))
        .doOnSuccess(response -> log.info("Withdrawal response: {}", response))
        .block(); // 동기적으로 결과를 기다림
  }

}