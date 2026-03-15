package com.village.repository;

import com.village.entity.Product;
import com.village.entity.Product.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    // 使用下划线语法查询关联实体的ID
    List<Product> findByFarmer_Id(Long farmerId);
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);
    Page<Product> findByStatusAndCategoryContaining(ProductStatus status, String category, Pageable pageable);
    List<Product> findByStatusIn(List<ProductStatus> statuses);
    
    // 统计农户指定状态的产品数量
    int countByFarmer_IdAndStatus(Long farmerId, ProductStatus status);

    List<Product> findByNameContainingOrCategoryContaining(String name, String category, org.springframework.data.domain.Sort sort);
    
    @Modifying
    @Transactional
    void deleteByFarmer_Id(Long farmerId);
}

