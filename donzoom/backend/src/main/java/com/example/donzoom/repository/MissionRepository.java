package com.example.donzoom.repository;

import com.example.donzoom.constant.MissionStatus;
import com.example.donzoom.entity.Mission;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionRepository extends JpaRepository<Mission, Long> {

  List<Mission> findAllMissionByUserId(Long userId);

  List<Mission> findByUserIdAndStatus(Long userId, MissionStatus status);

  Optional<Mission> findById(Long id);
}
