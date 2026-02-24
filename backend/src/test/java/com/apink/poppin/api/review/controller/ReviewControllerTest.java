//package com.apink.poppin.api.review.controller;
//
//import com.apink.poppin.api.review.dto.CommentDto;
//import com.apink.poppin.api.review.dto.ReviewDto;
//import com.apink.poppin.api.review.dto.ReviewUpdateRequestDto;
//import com.apink.poppin.api.review.entity.Comment;
//import com.apink.poppin.api.review.service.CommentService;
//import com.apink.poppin.api.review.service.ReviewService;
//import com.apink.poppin.common.exception.dto.BusinessLogicException;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.boot.test.mock.mockito.MockBean;
//import org.springframework.http.MediaType;
//import org.springframework.security.test.context.support.WithMockUser;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.time.Instant;
//import java.util.ArrayList;
//
//import static com.apink.poppin.common.exception.dto.ExceptionCode.REVIEW_ALREADY_DELETED;
//import static com.apink.poppin.common.exception.dto.ExceptionCode.REVIEW_NOT_FOUND;
//import static org.mockito.Mockito.*;
//import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
//
//@WebMvcTest(controllers = ReviewController.class)
//public class ReviewControllerTest {
//
//    @Autowired
//    private MockMvc mockMvc;
//
//    @Autowired
//    private ObjectMapper objectMapper;
//
//    @MockBean
//    private ReviewService reviewService;
//
//    @MockBean
//    private CommentService commentService;
//    ReviewDto reviewDto;
//    CommentDto commentDto;
//    ReviewUpdateRequestDto requestDto;
//
//    @BeforeEach
//    void setUp() {
//        reviewDto = ReviewDto.builder()
//                .reviewId(1L)
//                .title("Test")
//                .popupId(1L)
//                .content("Test Content")
//                .rating(4.0F)
//                .userTsid(1234567890L)
//                .createdAt(Instant.now())
//                .commentDtoList(new ArrayList<>())
//                .build();
//
//        commentDto = CommentDto.builder()
//                .userTsid(1234567890L)
//                .reviewId(1L)
//                .content("Test Content")
//                .build();
//
//        requestDto = ReviewUpdateRequestDto.builder()
//                .rating(4.0F)
//                .title("updated title")
//                .thumbnail("updated thumbnail")
//                .content("updated content")
//                .build();
//    }
//
//    @Test
//    @WithMockUser
//    void getReviewFound() throws Exception {
//
//        long reviewId = 1L;
//
//
//        when(reviewService.getReviewById(reviewId)).thenReturn(reviewDto);
//
//        mockMvc.perform(get("/api/reviews/{reviewId}", reviewId))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.reviewId").value(reviewId))
//                .andExpect(jsonPath("$.title").value("Test"))
//                .andDo(print());
//    }
//
//    @Test
//    @WithMockUser
//    void getReviewNotFound() throws Exception {
//
//        long reviewId = 1L;
//
//        when(reviewService.getReviewById(reviewId)).thenThrow(new BusinessLogicException(REVIEW_NOT_FOUND));
//
//        mockMvc.perform(get("/api/reviews/{reviewId}", reviewId))
//                .andExpect(status().isNotFound())
//                .andExpect(jsonPath("$.message").value("Review not found"))
//                .andDo(print());
//    }
//
//    @Test
//    @WithMockUser
//    void updateReviewSuccess() throws Exception {
//        long reviewId = 1L;
//
//        doNothing().when(reviewService).updateReview(eq(reviewId), any(ReviewUpdateRequestDto.class));
//
//        String json = objectMapper.writeValueAsString(requestDto);
//
//        mockMvc.perform(put("/api/reviews/{reviewId}", reviewId)
//                        .with(csrf())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(json))
//                .andExpect(status().isOk())
//                .andDo(print());
//    }
//
//    @Test
//    @WithMockUser
//    void updateReviewNotFound() throws Exception {
//        long reviewId = 1L;
//
//        doThrow(new BusinessLogicException(REVIEW_NOT_FOUND)).when(reviewService).updateReview(eq(reviewId), any(ReviewUpdateRequestDto.class));
//
//        String json = objectMapper.writeValueAsString(requestDto);
//
//        mockMvc.perform(put("/api/reviews/{reviewId}", reviewId)
//                        .with(csrf())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(json))
//                .andExpect(status().isNotFound())
//                .andExpect(jsonPath("$.message").value("Review not found"))
//                .andDo(print());
//    }
//
//    @Test
//    @WithMockUser
//    void deleteReviewSuccess() throws Exception {
//
//        doNothing().when(reviewService).deleteReview(anyLong());
//
//        mockMvc.perform(delete("/api/reviews/{reviewId}", 1L)
//                        .with(csrf()))
//                .andExpect(status().isOk())
//                .andDo(print());
//    }
//
//    @Test
//    @WithMockUser
//    void deleteReviewFailure() throws Exception {
//
//        doThrow(new BusinessLogicException(REVIEW_ALREADY_DELETED)).when(reviewService).deleteReview(anyLong());
//
//        mockMvc.perform(delete("/api/reviews/{reviewId}", 1L)
//                        .with(csrf()))
//                .andExpect(status().isBadRequest())
//                .andExpect(jsonPath("$.message").value("Review already deleted"))
//                .andDo(print());
//    }
//
//    @Test
//    @WithMockUser
//    void createCommentSuccess() throws Exception {
//
//        Comment comment = Comment.builder()
//                .content("Test Content")
//                .build();
//
//        when(commentService.createComment(anyLong(), eq(commentDto))).thenReturn(comment);
//
//        String json = objectMapper.writeValueAsString(commentDto);
//
//        mockMvc.perform(post("/api/reviews/{reviewId}/comments", 1L)
//                .with(csrf())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(json))
//                .andExpect(status().isOk());
//    }
//
//    @Test
//    @WithMockUser
//    void updateCommentSuccess() throws Exception {
//
//        doNothing().when(commentService).updateComment(commentDto.getReviewId(), commentDto.getCommentId(), commentDto);
//
//        String json = objectMapper.writeValueAsString(commentDto);
//
//        mockMvc.perform(put("/api/reviews/{reviewId}/comments/{commentId}", 1L, 1L)
//        .with(csrf())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(json))
//                .andExpect(status().isOk());
//    }
//}
