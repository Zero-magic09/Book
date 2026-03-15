package com.village.repository;

import com.village.entity.Withdrawal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

public interface WithdrawalRepository extends JpaRepository<Withdrawal, Long> {
    List<Withdrawal> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    
    // 统计已提现或提现中的总金额
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.farmerId = :farmerId AND w.status IN ('PENDING', 'APPROVED', 'COMPLETED')")
    BigDecimal sumTotalWithdrawnByFarmerId(Long farmerId);
    
    @Modifying
    @Transactional
    void deleteByFarmerId(Long farmerId);
}
