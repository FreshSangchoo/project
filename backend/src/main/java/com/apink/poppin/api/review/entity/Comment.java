package com.apink.poppin.api.review.entity;

import com.apink.poppin.api.review.dto.CommentCreateDto;
import com.apink.poppin.api.review.dto.CommentDto;
import com.apink.poppin.api.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "comment")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id", nullable = false)
    private Long commentId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @NotNull
    @Lob
    @Column(name = "content", nullable = false)
    private String content;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_tsid", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parent")
    private Comment parent;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted;

    public void createComment(CommentCreateDto commentDto, Review review, User user, Comment parent) {
        this.review = review;
        this.content = commentDto.getContent();
        this.createdAt = LocalDateTime.now();
        this.user = user;
        this.isDeleted = false;
        this.parent = parent;
    }

    public void updateComment(String content) {
        this.content = content;
    }

    public void deleteComment() {
        this.isDeleted = true;
    }
}