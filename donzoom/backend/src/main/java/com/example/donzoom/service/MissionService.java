package com.example.donzoom.service;

import com.example.donzoom.constant.MissionStatus;
import com.example.donzoom.dto.account.request.TransferRequestDto;
import com.example.donzoom.dto.mission.request.MissionCreateDto;
import com.example.donzoom.dto.mission.request.MissionUpdateDto;
import com.example.donzoom.dto.mission.response.MissionResponseDto;
import com.example.donzoom.entity.Mission;
import com.example.donzoom.entity.User;
import com.example.donzoom.repository.MissionRepository;
import com.example.donzoom.repository.UserRepository;
import com.example.donzoom.util.SecurityUtil;
import com.google.firebase.messaging.FirebaseMessagingException;
import java.time.LocalTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MissionService {

  private final FCMService fcmService;
  private static final Logger log = LoggerFactory.getLogger(MissionService.class);
  private final MissionRepository missionRepository;
  private final UserRepository userRepository;
  private final AccountService accountService;


  public List<MissionResponseDto> getUserMissions(Long userId, MissionStatus status) {
    // 현재 사용자의 미션 가져오기

    // 현재 인증된 사용자 정보 가져오기
    String username = SecurityUtil.getAuthenticatedUsername();

    // 사용자 정보 (예: PK) 가져오기, 로그인 되어 있는지 확인
    User loginUser = userRepository.findByEmail(username)
        .orElseThrow(() -> new RuntimeException("User not found"));

    // 미션을 조회하려는 유저를 검증
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found"));

    List<MissionResponseDto> list = missionRepository.findByUserIdAndStatus(userId, status).stream()
        .map(mission -> MissionResponseDto.builder().missionId(mission.getId())
            .contents(mission.getContents()).reward(mission.getReward()).status(mission.getStatus())
            .dueDate(mission.getDueDate()).build()).toList();

    return list;
  }

  public Mission getMissionById(Long missionId) {
    // 미션 아이디로 상세조회

    // Optional을 처리하고, 값이 없으면 예외를 던짐
    return missionRepository.findById(missionId)
        .orElseThrow(() -> new RuntimeException("Mission not found with id: " + missionId));
  }

  public Mission createMission(MissionCreateDto missionCreateDto) {

    User child = userRepository.findById(missionCreateDto.getChildId())
        .orElseThrow(() -> new RuntimeException("Child not found"));

    Mission mission = Mission.builder().user(child).contents(missionCreateDto.getContents())
        .reward(missionCreateDto.getReward())
        .dueDate(missionCreateDto.getDueDate().atTime(LocalTime.MAX)).status(MissionStatus.CREATED)
        .build();
    missionRepository.save(mission);
    try {
      fcmService.sendNotification(child,"미션생성","미션이 생성되었습니다.","4","default_status");
    } catch (FirebaseMessagingException e) {
      log.error("FCM 메세지를 보내는데 실패했습니다. {}", e.getMessage());
    }
    return mission;
  }

  public MissionResponseDto updateMission(Long missionId, MissionUpdateDto missionUpdateDto) {

    // 기존 미션 가져오기
    Mission mission = missionRepository.findById(missionId)
        .orElseThrow(() -> new RuntimeException("Mission not found"));

    mission.updateMission(missionUpdateDto);
    missionRepository.save(mission);
    if(mission.getStatus().equals(MissionStatus.DONE)){
      User parent = mission.getUser().getParent();
      try {
        fcmService.sendNotification(parent, "미션 완료 요청", "미션 완료 요청이 도착하였습니다.", "5", "default_status");
      } catch (FirebaseMessagingException e) {
        log.error(e.getMessage());
      }
    }else if(mission.getStatus().equals(MissionStatus.ACCEPTED)){
        // 송금 로직
        accountService.transfer(
            TransferRequestDto.builder()
            .depositAccountNo(mission.getUser().getAccountNo())
            .depositTransactionSummary("미션 보상금")
            .transactionBalance(mission.getReward())
            .withdrawalAccountNo(mission.getUser().getParent().getAccountNo())
            .withdrawalTransactionSummary("미션 보상금 지급")
            .build()
        );
        try {
            fcmService.sendNotification(mission.getUser(), "미션 완료", "미션이 완료되었습니다.", "6", "default_status");
        } catch (FirebaseMessagingException e) {
            log.error(e.getMessage());
        }
    }
    return MissionResponseDto.builder()
            .missionId(mission.getId())
            .contents(missionUpdateDto.getContents())
            .dueDate(mission.getDueDate())
            .reward(missionUpdateDto.getReward())
            .status(mission.getStatus())
            .build();
  }

  public Long deleteMission(Long missionId) {
    // 테스트를 위해서 권한체크 임시로 껐습니다.
    //    // 현재 인증된 사용자 정보 가져오기
    //    String username = SecurityUtil.getAuthenticatedUsername();
    //    // 사용자 정보 (예: PK) 가져오기
    //    User user = userRepository.findByEmail(username)
    //        .orElseThrow(() -> new RuntimeException("User not found"));
    //
    //    // 삭제할 미션이 존재하는지 확인
    //    Mission mission = missionRepository.findById(missionId)
    //        .orElseThrow(() -> new RuntimeException("Mission not found"));
    //
    //    // 미션이 현재 사용자의 것인지 확인 (권한 체크)
    //    if (!mission.getUser().equals(user)) {
    //      throw new RuntimeException("You are not authorized to delete this mission");
    //    }

    missionRepository.deleteById(missionId);
    return missionId;
  }


}
