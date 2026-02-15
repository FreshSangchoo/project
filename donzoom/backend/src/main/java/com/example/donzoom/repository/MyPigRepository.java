package com.example.donzoom.repository;

import com.example.donzoom.entity.MyPig;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MyPigRepository extends JpaRepository<MyPig, Long> {

  List<MyPig> findByWalletId(Long walletId);
}
