package com.village.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "address")
public class Address {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, length = 50)
    private String name;
    
    @Column(nullable = false, length = 20)
    private String phone;
    
    @Column(length = 50)
    private String province;
    
    @Column(length = 50)
    private String city;
    
    @Column(length = 50)
    private String district;
    
    @Column(nullable = false, length = 255)
    private String address;
    
    @Column(name = "is_default")
    private Boolean isDefault = false;
    
    @Transient
    private String detail; // 辅助字段，接收前端传参
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
