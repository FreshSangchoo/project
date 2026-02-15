package com.example.donzoom.repository;

import com.example.donzoom.entity.Quiz;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

  @Query("SELECT q FROM Quiz q WHERE q.id NOT IN "
      + "(SELECT uq.quiz.id FROM UserQuiz uq WHERE uq.user.id = :userId) " + "ORDER BY RAND()")
  List<Quiz> findUnsolvedQuizzesByUser(@Param("userId") Long userId, Pageable pageable);

  List<Quiz> findByIdIn(List<Long> ids);
}
