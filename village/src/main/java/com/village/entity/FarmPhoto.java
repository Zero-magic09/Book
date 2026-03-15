package com.village.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "farm_photo")
public class FarmPhoto {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "farmer_id", nullable = false)
    private Long farmerId;
    
    @Column(nullable = false, length = 500)
    private String url;
    
    @Column(length = 100)
    private String description; // 描述，如"果园全景"
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
