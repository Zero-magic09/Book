package com.village.repository;

import com.village.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Review> findByOrderIdOrderByCreatedAtDesc(Long orderId);
    boolean existsByOrderIdAndProductId(Long orderId, Long productId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Review r JOIN r.product p WHERE p.farmer.id = :farmerId")
    int countByFarmerId(Long farmerId);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Review r JOIN r.product p WHERE p.farmer.id = :farmerId ORDER BY r.createdAt DESC")
    List<Review> findByProductFarmerIdOrderByCreatedAtDesc(Long farmerId);

    List<Review> findByContentContainingOrProduct_NameContainingOrUser_RealNameContaining(String content, String productName, String realName, org.springframework.data.domain.Sort sort);
    
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
    
    @Modifying
    @Transactional
    void deleteByProduct_Farmer_Id(Long farmerId);
}
