package com.apink.poppin.api.review.integration;

import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.popup.repository.PopupRepository;
import com.apink.poppin.api.review.dto.ReviewUpdateRequestDto;
import com.apink.poppin.api.review.entity.Comment;
import com.apink.poppin.api.review.entity.Review;
import com.apink.poppin.api.review.repository.ReviewRepository;
import com.apink.poppin.api.user.entity.User;
import com.apink.poppin.api.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ReviewIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private PopupRepository popupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Review review;

    @BeforeEach
    public void setUp() {
        // 팝업, 유저, 매니저 엔티티와 레포지토리가 있어야 통합테스트 가능
        Popup popup = Popup.builder().build();
        User user = User.builder().build();

        userRepository.save(user);
        popupRepository.save(popup);

        List<Comment> comments = new ArrayList<>();

        review = Review.builder()
                .reviewId(1L)
                .popup(popup)
                .user(user)
                .rating(5.0F)
                .title("Initial Title")
                .thumbnail("Initial Thumbnail")
                .content("Initial Content")
                .comments(comments)
                .deleted(false)
                .build();
        reviewRepository.save(review);
    }

    @Test
    @WithMockUser
    void getReview() throws Exception {
        mockMvc.perform(get("/api/reviews/{reviewId}", review.getReviewId())
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(review.getTitle()))
                .andExpect(jsonPath("$.thumbnail").value(review.getThumbnail()))
                .andExpect(jsonPath("$.content").value(review.getContent()))
                .andExpect(jsonPath("$.rating").value(review.getRating()))
                .andExpect(jsonPath("$.deleted").value(false))
                .andDo(print());
    }

    @Test
    @WithMockUser
    void updateReview() throws Exception {

        ReviewUpdateRequestDto requestDto = ReviewUpdateRequestDto.builder()
                .title("Updated Title")
                .thumbnail("Updated Thumbnail")
                .content("Updated Content")
                .rating(4.0F)
                .build();

        String json = objectMapper.writeValueAsString(requestDto);

        mockMvc.perform(put("/api/reviews/{reviewId}", review.getReviewId()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(review.getTitle()))
                .andExpect(jsonPath("$.thumbnail").value(review.getThumbnail()))
                .andExpect(jsonPath("$.content").value(review.getContent()))
                .andExpect(jsonPath("$.rating").value(review.getRating()))
                .andExpect(jsonPath("$.deleted").value(false))
                .andDo(print());
    }

    @Test
    @WithMockUser
    void deleteReview() throws Exception {
        mockMvc.perform(delete("/api/reviews/{reviewId}", review.getReviewId()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDeleted").value(true))
                .andDo(print());
    }
}
