package com.village.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "review")
public class Review {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private Integer rating; // 1-5星
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Column(length = 1000)
    private String images; // 晒图URL，逗号分隔
    
    @Column(length = 100)
    private String taste; // 口感评价标签
    
    @Column(columnDefinition = "TEXT")
    private String reply; // 商家回复
    
    @Column(name = "reply_time")
    private LocalDateTime replyTime;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
