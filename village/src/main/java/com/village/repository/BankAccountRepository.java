package com.village.repository;

import com.village.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findByFarmerId(Long farmerId);
    int countByFarmerId(Long farmerId);

    List<BankAccount> findByBankNameContainingOrAccountNumberContainingOrAccountHolderContaining(String bankName, String accountNumber, String accountHolder, org.springframework.data.domain.Sort sort);
    
    @Modifying
    @Transactional
    void deleteByFarmerId(Long farmerId);
}
