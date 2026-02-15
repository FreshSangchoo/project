package com.example.donzoom.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MyPig extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "MY_PIG_ID")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY) // ManyToOne 관계 설정
  @JoinColumn(name = "WALLET_ID") // 외래 키 컬럼명 설정
  private Wallet wallet;


  @ManyToOne(fetch = FetchType.LAZY) // ManyToOne 관계 설정
  @JoinColumn(name = "PIG_ID") // 외래 키 컬럼명 설정
  private Pig pig;

  @Builder
  public MyPig(Wallet wallet, Pig pig) {
    this.wallet = wallet;
    this.pig = pig;
  }
}
