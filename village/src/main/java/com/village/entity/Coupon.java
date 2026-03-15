package com.village.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "coupon")
public class Coupon {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    // type: 1-reduction (full reduction), 2-discount (percentage)
    @Column(nullable = false)
    private Integer type; 
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal value; // discount amount or off percentage (e.g. 10.00 for 10 yuan off)
    
    @Column(name = "min_spend", precision = 10, scale = 2)
    private BigDecimal minSpend; // minimum spend to use
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "total_count")
    private Integer totalCount;
    
    @Column(name = "remaining_count")
    private Integer remainingCount;
    
    // status: 1-active, 0-disabled
    private Integer status = 1;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
