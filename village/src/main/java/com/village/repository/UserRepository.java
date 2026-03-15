package com.village.repository;

import com.village.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
    
    org.springframework.data.domain.Page<User> findByPhoneContainingOrRealNameContaining(String phone, String realName, org.springframework.data.domain.Pageable pageable);
    
    org.springframework.data.domain.Page<User> findByRole(User.Role role, org.springframework.data.domain.Pageable pageable);
}
