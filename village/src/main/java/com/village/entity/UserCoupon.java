package com.village.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_coupon")
public class UserCoupon {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;
    
    // status: 0-unused, 1-used, 2-expired
    private Integer status = 0; 
    
    @Column(name = "get_time")
    private LocalDateTime getTime;
    
    @Column(name = "use_time")
    private LocalDateTime useTime;
    
    @Column(name = "order_id")
    private Long orderId; // associated order if used
    
    @PrePersist
    protected void onCreate() {
        getTime = LocalDateTime.now();
    }
}
