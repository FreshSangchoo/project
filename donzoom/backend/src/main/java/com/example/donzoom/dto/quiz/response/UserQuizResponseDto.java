package com.example.donzoom.dto.quiz.response;

import com.example.donzoom.constant.QuizType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class UserQuizResponseDto {

  private Long id;

  @Enumerated(EnumType.STRING)
  private QuizType quizType;

  private String question;

  private String answer;

  private String option1;
  private String option2;
  private String option3;
  private String option4;

  private String explanations;
  private String answerExplanation;

  private LocalDateTime createdAt;
}
