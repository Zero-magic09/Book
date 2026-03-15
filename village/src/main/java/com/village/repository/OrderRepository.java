package com.village.repository;

import com.village.entity.Order;
import com.village.entity.Order.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    
    Order findByOrderNo(String orderNo);
    
    Page<Order> findByUserId(Long userId, Pageable pageable);
    
    List<Order> findByStatus(OrderStatus status);
    
    // 统计用户某状态的订单数量
    @Query("SELECT COUNT(o) FROM Order o WHERE o.user.id = :userId AND o.status = :status")
    int countByUserIdAndStatus(Long userId, OrderStatus status);

    // 统计待评价订单数量
    @Query("SELECT COUNT(o) FROM Order o WHERE o.user.id = :userId AND o.status = :status AND (o.reviewed IS NULL OR o.reviewed = :reviewed)")
    int countByUserIdAndStatusAndReviewed(Long userId, OrderStatus status, boolean reviewed);
    
    // 统计农户某状态的订单数量（通过订单明细关联）
    @Query("SELECT COUNT(DISTINCT o) FROM Order o JOIN o.items i WHERE i.product.farmer.id = :farmerId AND o.status = :status")
    int countByFarmerIdAndStatus(Long farmerId, OrderStatus status);
    
    // 计算农户本月营收 (仅计入已完成订单)
    @Query("SELECT COALESCE(SUM(i.subtotal), 0) FROM Order o JOIN o.items i WHERE i.product.farmer.id = :farmerId AND o.status = 'COMPLETED' AND MONTH(o.createdAt) = MONTH(CURRENT_DATE) AND YEAR(o.createdAt) = YEAR(CURRENT_DATE)")
    java.math.BigDecimal sumMonthlyRevenueByFarmerId(Long farmerId);

    // 统计某个产品的累计销量 (排除待支付和已取消订单)
    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM OrderItem i WHERE i.product.id = :productId AND i.order.status NOT IN ('PENDING', 'CANCELLED')")
    int sumSalesByProductId(Long productId);

    // 计算农户总营收 (状态为 COMPLETED 的订单)
    @Query("SELECT COALESCE(SUM(i.subtotal), 0) FROM Order o JOIN o.items i WHERE i.product.farmer.id = :farmerId AND o.status = :status")
    java.math.BigDecimal sumTotalRevenueByFarmerId(Long farmerId, OrderStatus status);

    // 统计每日订单量（最近7天）
    @Query("SELECT CAST(o.createdAt AS date) as date, COUNT(o) FROM Order o WHERE o.createdAt >= :startDate GROUP BY CAST(o.createdAt AS date) ORDER BY date ASC")
    List<Object[]> countDailyOrders(java.time.LocalDateTime startDate);

    // 通过关键词搜索订单（订单号或用户名）
    @Query("SELECT o FROM Order o WHERE o.orderNo LIKE %:keyword% OR o.user.realName LIKE %:keyword%")
    List<Order> findByKeyword(String keyword, org.springframework.data.domain.Sort sort);

    // 查询农户相关订单
    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.product.farmer.id = :farmerId")
    Page<Order> findByFarmerId(Long farmerId, Pageable pageable);
    
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
    
    // 查找包含特定农户商品的订单（用于删除农户时清理订单）
    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.product.farmer.id = :farmerId")
    List<Order> findOrdersByFarmerId(Long farmerId);
}
