package com.example.donzoom.entity;

import com.example.donzoom.constant.MissionStatus;
import com.example.donzoom.dto.mission.request.MissionUpdateDto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;


@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Mission {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "mission_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  private User user;

  private String contents;
  private Long reward;

  @Enumerated(EnumType.STRING)
  private MissionStatus status;
  private LocalDateTime dueDate;

  @Builder
  public Mission(User user, String contents, Long reward, MissionStatus status,
      LocalDateTime dueDate) {
    this.user = user;
    this.contents = contents;
    this.reward = reward;
    this.status = status;
    this.dueDate = dueDate;
  }

  public void updateMission(MissionUpdateDto missionUpdateDto) {
    this.contents =
        missionUpdateDto.getContents() == null ? this.contents : missionUpdateDto.getContents();
    this.reward = missionUpdateDto.getReward() == null ? this.reward : missionUpdateDto.getReward();
    this.dueDate =
        missionUpdateDto.getDueDate() == null ? this.dueDate : missionUpdateDto.getDueDate();
    this.status = missionUpdateDto.getStatus() == null ? this.status : missionUpdateDto.getStatus();
  }

}
