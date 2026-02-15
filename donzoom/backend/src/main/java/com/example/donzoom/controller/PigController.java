package com.example.donzoom.controller;

import com.example.donzoom.dto.pig.response.PigResponseDto;
import com.example.donzoom.dto.ticket.response.BuyTicketResponseDto;
import com.example.donzoom.repository.PigRepository;
import com.example.donzoom.service.PigService;
import com.example.donzoom.service.WalletService;
import com.example.donzoom.util.FileUploadUtil;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/pig")
public class PigController {

  private final PigService pigService;
  private final WalletService walletService;
  private final FileUploadUtil fileUploadUtil;
  private final PigRepository pigRepository;

  // 사용자가 소유한 돼지 목록 조회
  @GetMapping("/owned")
  public ResponseEntity<List<PigResponseDto>> getOwnedPigs() {
    List<PigResponseDto> ownedPigs = pigService.findOwnedPigs();
    return ResponseEntity.ok(ownedPigs);
  }

  @GetMapping
  public ResponseEntity<List<PigResponseDto>> getPigs() {
    try {
      List<PigResponseDto> pigs = pigService.findPigs();
      return new ResponseEntity<>(pigs, HttpStatus.OK); // 성공 상태 코드와 데이터 반환
    } catch (Exception e) {
      return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // 잘못된 요청인 경우
    }
  }

  @GetMapping("/{pigId}")
  public ResponseEntity<PigResponseDto> getPigById(@PathVariable Long pigId) {
    try {
      PigResponseDto pigResponse = pigService.findPigById(pigId);
      return ResponseEntity.ok(pigResponse);
    } catch (Exception e) {
      return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // 잘못된 요청인 경우
    }
  }

  @PostMapping("/ticket")
  public ResponseEntity<?> createReport(@RequestParam String amount) {
    try {
      BuyTicketResponseDto buyTicketResponseDto = walletService.buyTicket(amount);
      return new ResponseEntity<>(buyTicketResponseDto, HttpStatus.CREATED); // 성공 상태 코드
    } catch (Exception e) {
      log.error(e.getMessage());
      return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR); // 오류 상태 코드
    }
  }

  @PostMapping
  public List<PigResponseDto> getRandomPigsAndAddToWallet(@RequestParam String amount) {
    return pigService.getRandomPigsAndAddToWallet(amount);
  }

  // 파일 업로드 및 Pig 데이터 저장 API
  @PostMapping("/upload")
  public ResponseEntity<String> uploadFileAndSavePig(
      @RequestParam("imageFile") MultipartFile imageFile,
      @RequestParam("silhouetteFile") MultipartFile silhouetteFile,
      @RequestParam("name") String name, @RequestParam("probability") double probability,
      @RequestParam("description") String description) {
    try {
      // PigService를 사용하여 이미지 저장 및 Pig 데이터 저장
      String responseMessage = pigService.uploadPigAndSave(imageFile, silhouetteFile, name,
          probability, description);

      return ResponseEntity.ok("돼지 저장 성공! " + responseMessage);

    } catch (IOException e) {
      return ResponseEntity.status(500).body("파일 업로드 중 오류 발생: " + e.getMessage());
    }
  }
}
