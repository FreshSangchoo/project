package com.example.donzoom.repository;

import com.example.donzoom.constant.MissionStatus;
import com.example.donzoom.entity.Alarm;
import com.example.donzoom.entity.Mission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlarmRepository extends JpaRepository<Alarm, Long> {

  List<Alarm> findAllAlarmsByUserIdOrderByCreatedAtDesc(Long userId);

  Optional<Alarm> findById(Long id);
}
