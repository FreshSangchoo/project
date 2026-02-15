package com.example.donzoom.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SavingAccount {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "saving_account_id")
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", unique = true)
  private User user;

  private Double monthlyDeposit;
  private LocalDateTime startDate;
  private LocalDateTime maturityDate;
  private Double totalDepositedAmount;

  @Builder
  public SavingAccount(User user, Double monthlyDeposit, LocalDateTime startDate, LocalDateTime maturityDate) {
    this.user = user;
    this.monthlyDeposit = monthlyDeposit;
    this.startDate = startDate;
    this.maturityDate = maturityDate;
    this.totalDepositedAmount = 0.0;
  }

  public void deposit(Double amount) {
    this.totalDepositedAmount += amount;
  }

  public double calculateInterest(double rate) {
    return totalDepositedAmount * (rate / 100);
  }
}
