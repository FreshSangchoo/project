package com.example.donzoom.entity;

import com.example.donzoom.constant.QuizType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Quiz {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "quiz_id")
  private Long id;

  @Enumerated(EnumType.STRING)
  private QuizType quizType;

  @Column(columnDefinition = "TEXT")
  private String question;

  private String answer;

  private String option1;
  private String option2;
  private String option3;
  private String option4;

  @Column(columnDefinition = "TEXT")
  private String explanations;
  @Column(columnDefinition = "TEXT")
  private String answerExplanation;


  @Builder
  public Quiz(QuizType quizType, String question, String answer, String option1, String option2,
      String option3, String option4, String explanations, String answerExplanation) {
    this.quizType = quizType;
    this.question = question;
    this.answer = answer;
    this.option1 = option1;
    this.option2 = option2;
    this.option3 = option3;
    this.option4 = option4;
    this.explanations = explanations;
    this.answerExplanation = answerExplanation;
  }

}
