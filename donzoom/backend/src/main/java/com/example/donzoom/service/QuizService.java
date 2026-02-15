package com.example.donzoom.service;

import com.example.donzoom.dto.quiz.request.QuizAnswerDto;
import com.example.donzoom.dto.quiz.response.QuizAnswerResponseDto;
import com.example.donzoom.dto.quiz.response.UserQuizResponseDto;
import com.example.donzoom.entity.Quiz;
import com.example.donzoom.entity.User;
import com.example.donzoom.entity.UserQuiz;
import com.example.donzoom.repository.QuizRepository;
import com.example.donzoom.repository.UserQuizRepository;
import com.example.donzoom.repository.UserRepository;
import com.example.donzoom.util.SecurityUtil;
import com.example.donzoom.util.TimeUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.List;
import java.util.stream.Collectors;

import com.google.firebase.messaging.FirebaseMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

  private final String todayQuizPrefix = "TodayQuiz: ";

  private final TimeUtil timeUtil;
  private final RedisService redisService;
  private final WalletService walletService;
  private final QuizRepository quizRepository;
  private final UserRepository userRepository;
  private final UserQuizRepository userQuizRepository;
  private final UserService userService;
  private final FCMService fcmService;

  public List<Quiz> getTodayQuizzes() {
    // 오늘의 퀴즈 안푼것중  (랜덤 3개) 가져오기

    String username = SecurityUtil.getAuthenticatedUsername();
    User user = userRepository.findByEmail(username)
        .orElseThrow(() -> new RuntimeException("User not found"));

    List<Quiz> unsolvedQuizzes;
    Pageable limit = PageRequest.of(0, 3);

    // 비어 있다면
    if (redisService.getList(todayQuizPrefix + username, new TypeReference<List<Long>>() {
    }) == null || redisService.getList(todayQuizPrefix + username, new TypeReference<List<Long>>() {
    }).isEmpty()) {
      unsolvedQuizzes = quizRepository.findUnsolvedQuizzesByUser(user.getId(), limit);
      redisService.saveListWithTTL(todayQuizPrefix + username,
          unsolvedQuizzes.stream().map(Quiz::getId).toList(), timeUtil.getSecondsUntilEndOfDay());
    } else {
      List<Long> list = redisService.getList(todayQuizPrefix + username,
          new TypeReference<List<Long>>() {
          });

      List<Long> solvedQuizzes = userQuizRepository.findAllByUserId(user.getId()).orElseThrow()
          .stream().map(userQuiz -> userQuiz.getQuiz().getId()).toList();
      unsolvedQuizzes = quizRepository.findByIdIn(list).stream()
          .filter(quiz -> !solvedQuizzes.contains(quiz.getId())).toList();
    }

    return unsolvedQuizzes;
  }


  public List<UserQuizResponseDto> getUserQuizzes() {
    // 내가 푼 퀴즈 기록들 가져오기 

    // 현재 로그인된 사용자 정보 가져오기
    String username = SecurityUtil.getAuthenticatedUsername();
    User user = userRepository.findByEmail(username)
        .orElseThrow(() -> new RuntimeException("User not found"));

    // 유저가 푼 퀴즈 목록 가져오기
    List<UserQuiz> userQuizzes = userQuizRepository.findAllByUserId(user.getId())
        .orElseThrow(() -> new RuntimeException("Quiz Not Found"));
    return userQuizzes.stream().map(uq -> UserQuizResponseDto.builder().id(uq.getQuiz().getId())
        .quizType(uq.getQuiz().getQuizType()).question(uq.getQuiz().getQuestion())
        .answer(uq.getQuiz().getAnswer()).option1(uq.getQuiz().getOption1())
        .option2(uq.getQuiz().getOption2()).option3(uq.getQuiz().getOption3())
        .option4(uq.getQuiz().getOption4()).explanations(uq.getQuiz().getExplanations())
        .answerExplanation(uq.getQuiz().getAnswerExplanation()).createdAt(uq.getCreatedAt())
        .build()).collect(Collectors.toList());
  }

  public List<UserQuizResponseDto> getUserQuizzesByEmail(String email) {
    // 내가 푼 퀴즈 기록들 가져오기

    // 이메일로 사용자 정보 가져오기
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

    // 유저가 푼 퀴즈 목록 가져오기
    List<UserQuiz> userQuizzes = userQuizRepository.findAllByUserId(user.getId())
        .orElseThrow(() -> new RuntimeException("Quiz Not Found"));
    return userQuizzes.stream().map(uq -> UserQuizResponseDto.builder().id(uq.getQuiz().getId())
        .quizType(uq.getQuiz().getQuizType()).question(uq.getQuiz().getQuestion())
        .answer(uq.getQuiz().getAnswer()).option1(uq.getQuiz().getOption1())
        .option2(uq.getQuiz().getOption2()).option3(uq.getQuiz().getOption3())
        .option4(uq.getQuiz().getOption4()).explanations(uq.getQuiz().getExplanations())
        .answerExplanation(uq.getQuiz().getAnswerExplanation()).createdAt(uq.getCreatedAt())
        .build()).collect(Collectors.toList());
  }

  public QuizAnswerResponseDto submitAnswer(Long quizId, QuizAnswerDto quizAnswerDto) {
    // 정답 제출하기

    // 현재 로그인된 사용자 정보 가져오기
    User user = userService.findCurrentUser();

    // 퀴즈 정보 가져오기
    Quiz quiz = quizRepository.findById(quizId)
        .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));

    boolean isCorrect = quiz.getAnswer().equals(quizAnswerDto.getAnswer().trim());
    // 유저가 제출한 답안을 UserQuiz에 저장
    UserQuiz userQuiz = UserQuiz.builder().user(user).quiz(quiz)
        .selectedAnswer(quizAnswerDto.getAnswer()).isCorrect(isCorrect).build();

    if (isCorrect) {
      try {
        fcmService.sendNotification(userService.findCurrentUser(),"코인 획득",500000+"코인을 획득하였습니다."
        ,"1","default");
      } catch (FirebaseMessagingException e) {
        log.error("FCM 메세지를 보내는데 실패했습니다. {}", e.getMessage());
      }
      walletService.updateCoin(500000);
    }

    userQuizRepository.save(userQuiz);
    return QuizAnswerResponseDto.builder().id(quiz.getId())
        .quizType(quiz.getQuizType()).question(quiz.getQuestion())
        .answer(quiz.getAnswer()).option1(quiz.getOption1())
        .option2(quiz.getOption2()).option3(quiz.getOption3())
        .option4(quiz.getOption4()).explanations(quiz.getExplanations())
        .answerExplanation(quiz.getAnswerExplanation()).createdAt(userQuiz.getCreatedAt())
        .isCorrect(isCorrect).build();
  }

}
