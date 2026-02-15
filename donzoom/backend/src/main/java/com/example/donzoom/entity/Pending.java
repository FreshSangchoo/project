package com.example.donzoom.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Pending {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "pending_id")
  private Long id;

  private String childEmail;

  private String parentId;

  @Builder
  public Pending(String childEmail,String parentId) {
    this.childEmail = childEmail;
    this.parentId = parentId;
  }
}
