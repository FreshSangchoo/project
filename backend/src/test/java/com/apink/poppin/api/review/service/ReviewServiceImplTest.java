package com.apink.poppin.api.review.service;

import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.popup.repository.PopupRepository;
import com.apink.poppin.api.review.dto.ReviewDto;
import com.apink.poppin.api.review.dto.ReviewUpdateRequestDto;
import com.apink.poppin.api.review.entity.Comment;
import com.apink.poppin.api.review.entity.Review;
import com.apink.poppin.api.review.repository.ReviewRepository;
import com.apink.poppin.api.user.entity.User;
import com.apink.poppin.api.user.repository.UserRepository;
import com.apink.poppin.common.exception.dto.BusinessLogicException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.apink.poppin.common.exception.dto.ExceptionCode.REVIEW_ALREADY_DELETED;
import static com.apink.poppin.common.exception.dto.ExceptionCode.REVIEW_NOT_FOUND;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PopupRepository popupRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    @Test
    @WithMockUser
    void getReviewByIdFound() {
        long reviewId = 1L;
        Popup popup = mock(Popup.class);
        User user = mock(User.class);
        List<Comment> comments = new ArrayList<>();
        Review review = Review.builder()
                .reviewId(reviewId)
                .title("Test")
                .comments(comments)
                .popup(popup)
                .user(user)
                .build();
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));

        ReviewDto reviewDto  = reviewService.getReviewById(reviewId);

        assertNotNull(reviewDto);
        assertEquals(reviewDto.getReviewId(), reviewId);
        assertEquals(reviewDto.getTitle(), "Test");
        verify(reviewRepository, times(1)).findById(reviewId);
    }

    @Test
    @WithMockUser
    void getReviewByIdNotFound() {
        long reviewId = 1L;
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.empty());

        BusinessLogicException exception = assertThrows(BusinessLogicException.class,
                () -> reviewService.getReviewById(reviewId));
        assertEquals(REVIEW_NOT_FOUND.getMessage(), exception.getMessage());
        verify(reviewRepository, times(1)).findById(reviewId);
    }

    @Test
    @WithMockUser
    void updateReviewSuccess() {

        Review existingReview = Review.builder()
                .rating(5.0F)
                .title("existing title")
                .build();

        ReviewUpdateRequestDto requestDto = ReviewUpdateRequestDto.builder()
                .rating(4.0F)
                .title("updated title")
                .thumbnail("updated thumbnail")
                .content("updated content")
                .build();

        when(reviewRepository.findById(anyLong())).thenReturn(Optional.of(existingReview));

        reviewService.updateReview(1L, requestDto);

        assertEquals(existingReview.getRating(), requestDto.getRating());
        assertEquals(existingReview.getTitle(), requestDto.getTitle());
        verify(reviewRepository, times(1)).findById(anyLong());
        verify(reviewRepository, times(1)).save(existingReview);
    }

    @Test
    @WithMockUser
    void updateReviewNotFound() {
        long reviewId = 1L;
        ReviewUpdateRequestDto requestDto = ReviewUpdateRequestDto.builder().build();
        when(reviewRepository.findById(anyLong())).thenReturn(Optional.empty());

        BusinessLogicException exception = assertThrows(BusinessLogicException.class,
                () -> reviewService.updateReview(reviewId, requestDto));

        assertEquals(REVIEW_NOT_FOUND.getMessage(), exception.getMessage());
    }

    @Test
    @WithMockUser
    void updateDeletedReview() {
        long reviewId = 1L;
        ReviewUpdateRequestDto requestDto = ReviewUpdateRequestDto.builder().build();
        Review review = Review.builder().deleted(true).build();
        when(reviewRepository.findById(anyLong())).thenReturn(Optional.of(review));

        BusinessLogicException exception = assertThrows(BusinessLogicException.class,
                () -> reviewService.updateReview(reviewId, requestDto));

        assertEquals(REVIEW_ALREADY_DELETED.getMessage(), exception.getMessage());
    }

    @Test
    @WithMockUser
    void deleteReviewSuccess() {
        Review review = Review.builder()
                        .deleted(false).build();
        when(reviewRepository.findById(anyLong())).thenReturn(Optional.of(review));

        reviewService.deleteReview(anyLong());

        assertTrue(review.isDeleted());
        verify(reviewRepository, times(1)).findById(anyLong());
        verify(reviewRepository, times(1)).save(review);
    }

    @Test
    @WithMockUser
    void deleteReviewNotFound() {
        when(reviewRepository.findById(anyLong())).thenReturn(Optional.empty());
        BusinessLogicException exception = assertThrows(BusinessLogicException.class,
                () -> reviewService.deleteReview(anyLong()));

        assertEquals(REVIEW_NOT_FOUND.getMessage(), exception.getMessage());
    }

    @Test
    @WithMockUser
    void deleteDeletedReview() {
        // given
        Review review = Review.builder().deleted(true).build();
        when(reviewRepository.findById(anyLong())).thenReturn(Optional.of(review));

        // when
        BusinessLogicException exception = assertThrows(BusinessLogicException.class,
                () -> reviewService.deleteReview(anyLong()));

        // then
        assertEquals(REVIEW_ALREADY_DELETED.getMessage(), exception.getMessage());
        verify(reviewRepository, times(1)).findById(anyLong());
    }

    @Test
    @WithMockUser
    void createReviewSuccess() {

        Popup popup = mock(Popup.class);
        User user = mock(User.class);
        ReviewDto reviewDto = ReviewDto.builder().build();

        doReturn(Optional.of(popup)).when(popupRepository).findById(anyLong());
        doReturn(Optional.of(user)).when(userRepository).findUserByUserTsid(anyLong());
        doNothing().when(reviewRepository).save(any(Review.class));

        reviewService.createReview(anyLong(), reviewDto);

        verify(reviewRepository, times(1)).save(any(Review.class));
    }
}
