package com.example.donzoom.dto.quiz.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuizAnswerDto {

  private final String answer;

  @JsonCreator
  public QuizAnswerDto(@JsonProperty("answer") String answer) {
    this.answer = answer;
  }
}
