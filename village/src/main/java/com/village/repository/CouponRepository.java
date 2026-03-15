package com.village.repository;

import com.village.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findByStatusOrderByEndTimeDesc(Integer status);
    
    // Find active coupons that are not expired and have remaining count
    @Query("SELECT c FROM Coupon c WHERE c.status = 1 AND c.endTime > CURRENT_TIMESTAMP AND c.remainingCount > 0")
    List<Coupon> findAvailableCoupons();

    List<Coupon> findByNameContaining(String name, org.springframework.data.domain.Sort sort);
}
