package com.apink.poppin.api.review.controller;

import com.apink.poppin.api.review.dto.*;
import com.apink.poppin.api.review.service.CommentService;
import com.apink.poppin.api.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final CommentService commentService;

    @GetMapping("/{reviewId}")
    public ResponseEntity<?> getReview(@PathVariable long reviewId) {
        ReviewDto reviewDto = reviewService.getReviewById(reviewId);

        return ResponseEntity.ok(reviewDto);
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(@PathVariable long reviewId, @RequestPart ReviewUpdateRequestDto requestDto, @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail) {
        reviewService.updateReview(reviewId, requestDto, thumbnail);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable long reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{reviewId}/comments")
    public ResponseEntity<?> createComment(@PathVariable long reviewId, @RequestBody CommentCreateDto commentDto) {
        long userTsid = Long.parseLong(SecurityContextHolder.getContext().getAuthentication().getName());
        commentService.createComment(reviewId, commentDto, userTsid);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{reviewId}/comments/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable long reviewId, @PathVariable long commentId, @RequestBody CommentDto commentDto) {
        commentService.updateComment(reviewId, commentId, commentDto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{reviewId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable long reviewId, @PathVariable long commentId) {
        commentService.deleteComment(reviewId, commentId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> getReviews() {
        List<ReviewListDto> list = reviewService.getReviews();

        return ResponseEntity.ok(list);
    }

    @PostMapping("/image")
    public ResponseEntity<?> uploadReviewImage(@RequestPart(value = "img", required = false) MultipartFile img) {
        String imagePath = reviewService.uploadReviewImage(img);

        return ResponseEntity.ok(imagePath);
    }
}
