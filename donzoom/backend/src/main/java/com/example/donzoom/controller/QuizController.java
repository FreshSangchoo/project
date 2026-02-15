package com.example.donzoom.controller;

import com.example.donzoom.dto.quiz.request.QuizAnswerDto;
import com.example.donzoom.dto.quiz.response.QuizAnswerResponseDto;
import com.example.donzoom.dto.quiz.response.UserQuizResponseDto;
import com.example.donzoom.entity.Quiz;
import com.example.donzoom.service.QuizService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/quiz")
public class QuizController {

  private final QuizService quizService;

  @GetMapping
  public ResponseEntity<?> getQuiz() {
    // 내가 푼 퀴즈 가져오기
    List<UserQuizResponseDto> myQuizzes = quizService.getUserQuizzes();
    return new ResponseEntity<>(myQuizzes, HttpStatus.OK);
  }

  @GetMapping("/child")
  public ResponseEntity<?> getQuizByEmail(@RequestParam String email) {
    // 내가 푼 퀴즈 가져오기
    List<UserQuizResponseDto> myQuizzes = quizService.getUserQuizzesByEmail(email);
    return new ResponseEntity<>(myQuizzes, HttpStatus.OK);
  }

  @GetMapping("/today")
  public ResponseEntity<?> getTodayQuiz() {
    // 오늘의 퀴즈 불러오기
    List<Quiz> todayQuizzes = quizService.getTodayQuizzes();
    return new ResponseEntity<>(todayQuizzes, HttpStatus.OK);
  }

  @PostMapping("/{quizId}")
  public ResponseEntity<?> submitTodayAnswer(@PathVariable Long quizId,
      @RequestBody QuizAnswerDto quizAnswerDto) {
    //퀴즈 정답 제출하기
    QuizAnswerResponseDto quizAnswerResponseDto = quizService.submitAnswer(quizId, quizAnswerDto);
    return new ResponseEntity<>(quizAnswerResponseDto,HttpStatus.OK);
  }


}
