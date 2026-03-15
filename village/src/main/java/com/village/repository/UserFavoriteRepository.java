package com.village.repository;

import com.village.entity.UserFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {
    Optional<UserFavorite> findByUserIdAndProductId(Long userId, Long productId);
    Long countByUserId(Long userId);
    
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
}
