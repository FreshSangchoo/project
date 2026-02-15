package com.example.donzoom.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Pig {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "PIG_ID")
  private Long id;

  private String imageUrl;

  private String pigName;

  private double probability;

  private String description;

  // 실루엣 이미지 URL
  private String silhouetteImageUrl;

  @Builder
  public Pig(String imageUrl, String pigName, double probability, String silhouetteImageUrl,
      String description) {
    this.imageUrl = imageUrl;
    this.pigName = pigName;
    this.probability = probability;
    this.silhouetteImageUrl = silhouetteImageUrl;
    this.description = description;
  }

}
