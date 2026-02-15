package com.example.donzoom.repository;

import com.example.donzoom.entity.UserQuiz;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserQuizRepository extends JpaRepository<UserQuiz, Long> {

  Optional<List<UserQuiz>> findAllByUserId(Long userId);
}
