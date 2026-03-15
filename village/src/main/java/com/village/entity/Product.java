package com.village.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "product")
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;
    
    // 便于前端获取farmerId
    public Long getFarmerId() {
        return farmer != null ? farmer.getId() : null;
    }
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(length = 20)
    private String unit = "斤";
    
    private Integer stock = 0;
    
    @Column(length = 50)
    private String category;
    
    @Column(length = 100)
    private String origin;
    
    @Column(length = 255)
    private String badge;
    
    @Column(length = 500)
    private String image;
    
    @Column(columnDefinition = "JSON")
    private String images;
    
    @Enumerated(EnumType.STRING)
    private ProductStatus status = ProductStatus.PENDING;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ================= Virtual Fields for UI =================

    @Transient
    private String auditStatus;

    @Transient
    private String salesStatus;

    public String getAuditStatus() {
        if (status == ProductStatus.PENDING) return "PENDING";
        if (status == ProductStatus.REJECTED) return "REJECTED";
        return "APPROVED"; // APPROVED or OFFLINE
    }

    public void setAuditStatus(String auditStatus) {
        if ("PENDING".equals(auditStatus)) {
            this.status = ProductStatus.PENDING;
        } else if ("REJECTED".equals(auditStatus)) {
            this.status = ProductStatus.REJECTED;
        } else if ("APPROVED".equals(auditStatus)) {
            // Only change to APPROVED if valid transition
            if (this.status == ProductStatus.PENDING || this.status == ProductStatus.REJECTED) {
                this.status = ProductStatus.APPROVED;
            }
        }
    }

    public String getSalesStatus() {
        if (status == ProductStatus.APPROVED) return "ON_SALE";
        if (status == ProductStatus.OFFLINE) return "OFFLINE";
        return "NOT_ON_SALE"; // PENDING or REJECTED
    }

    public void setSalesStatus(String salesStatus) {
        if ("ON_SALE".equals(salesStatus)) {
            this.status = ProductStatus.APPROVED;
        } else if ("OFFLINE".equals(salesStatus)) {
            this.status = ProductStatus.OFFLINE;
        }
    }
    
    public enum ProductStatus {
        PENDING, APPROVED, REJECTED, OFFLINE
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
