package com.example.donzoom.repository;

import com.example.donzoom.entity.AutoTransfer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AutoTransferRepository extends JpaRepository<AutoTransfer, Long> {

  List<AutoTransfer> findByTransferDate(String transferDate);

  Optional<AutoTransfer> findByWithdrawalAccountNoAndDepositAccountNo(String withdrawalAccountNo,
      String depositAccountNo);
}
