package com.example.donzoom.repository;

import com.example.donzoom.entity.SavingAccount;
import com.example.donzoom.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavingAccountRepository extends JpaRepository<SavingAccount, Long> {

  // 특정 사용자에 대한 적금 계좌 조회
  Optional<SavingAccount> findByUser(User user);
}
