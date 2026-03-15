package com.village.repository;

import com.village.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserIdOrderByIsDefaultDesc(Long userId);
    int countByUserId(Long userId);
    
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
    
    List<Address> findByNameContainingOrPhoneContainingOrAddressContaining(String name, String phone, String address, org.springframework.data.domain.Sort sort);
}
