package com.village.repository;

import com.village.entity.FarmPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface FarmPhotoRepository extends JpaRepository<FarmPhoto, Long> {
    List<FarmPhoto> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    int countByFarmerId(Long farmerId);
    
    @Modifying
    @Transactional
    void deleteByFarmerId(Long farmerId);
}
