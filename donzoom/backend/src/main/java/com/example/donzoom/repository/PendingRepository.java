package com.example.donzoom.repository;

import com.example.donzoom.entity.News;
import com.example.donzoom.entity.Pending;
import com.example.donzoom.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PendingRepository extends JpaRepository<Pending, Long> {
  Optional<Pending> findByChildEmail(String email);
}
