package com.village.repository;

import com.village.entity.UserCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface UserCouponRepository extends JpaRepository<UserCoupon, Long> {
    List<UserCoupon> findByUserIdOrderByGetTimeDesc(Long userId);
    List<UserCoupon> findByUserIdAndStatus(Long userId, Integer status);
    boolean existsByUserIdAndCouponId(Long userId, Long couponId);
    int countByUserIdAndStatus(Long userId, Integer status);

    List<UserCoupon> findByUser_RealNameContainingOrCoupon_NameContaining(String realName, String couponName, org.springframework.data.domain.Sort sort);
    
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
}
