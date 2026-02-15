package com.example.donzoom.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserQuiz extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "user_quiz_id")
  private Long id;

  @ManyToOne
  @JoinColumn(name = "user_id")
  private User user;

  @ManyToOne
  @JoinColumn(name = "quiz_id")
  private Quiz quiz;

  private Boolean isCorrect;
  private String selectedAnswer;

  @Builder
  public UserQuiz(User user, Quiz quiz, String selectedAnswer, Boolean isCorrect) {
    this.user = user;
    this.quiz = quiz;
    this.selectedAnswer = selectedAnswer;
    this.isCorrect = isCorrect;
  }

}
