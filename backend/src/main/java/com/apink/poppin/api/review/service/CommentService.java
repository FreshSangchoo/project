package com.apink.poppin.api.review.service;

import com.apink.poppin.api.review.dto.CommentCreateDto;
import com.apink.poppin.api.review.dto.CommentDto;
import com.apink.poppin.api.review.entity.Comment;

public interface CommentService {

    Comment createComment(long reviewId, CommentCreateDto commentDto, long userTsid);

    void updateComment(long reviewId, long commentId, CommentDto commentDto);

    void deleteComment(long reviewId, long commentId);
}
