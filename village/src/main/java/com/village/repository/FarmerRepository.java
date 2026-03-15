package com.village.repository;

import com.village.entity.Farmer;
import com.village.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.List;

public interface FarmerRepository extends JpaRepository<Farmer, Long> {
    Optional<Farmer> findByUser(User user);
    Optional<Farmer> findByUserId(Long userId);
    List<Farmer> findByVerified(Boolean verified, org.springframework.data.domain.Sort sort);
    List<Farmer> findByFarmNameContainingOrProvinceContainingOrCityContaining(String farmName, String province, String city, org.springframework.data.domain.Sort sort);
    
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
}
