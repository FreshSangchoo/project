package com.example.donzoom.repository;

import com.example.donzoom.entity.TransactionHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionHistoryRepository extends JpaRepository<TransactionHistory, Long> {

  List<TransactionHistory> findByWalletId(Long walletId);

  List<TransactionHistory> findByWalletIdAndStockId(Long walletId, Long stockId);

}
