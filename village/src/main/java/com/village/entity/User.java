package com.village.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 20)
    private String phone;
    
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.CONSUMER;
    
    @Column(name = "real_name", length = 50)
    private String realName;
    
    @Column(name = "id_card", length = 18)
    private String idCard;
    
    @Column(length = 500)
    private String avatar;
    
    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;
    
    // 足迹数量
    private Integer footprintCount = 0;
    
    // 收藏数量
    private Integer favoritesCount = 0;
    
    // 生态积分
    private Integer points = 0;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum Role {
        CONSUMER, FARMER, ADMIN
    }
    
    public enum Status {
        ACTIVE, DISABLED, PENDING
    }
    
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
