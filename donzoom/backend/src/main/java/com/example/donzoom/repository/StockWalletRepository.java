package com.example.donzoom.repository;

import com.example.donzoom.entity.StockWallet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockWalletRepository extends JpaRepository<StockWallet, Long> {

  List<StockWallet> findByWalletId(Long walletId);

  Optional<StockWallet> findByWalletIdAndStockId(Long walletId, Long stockId);

}
