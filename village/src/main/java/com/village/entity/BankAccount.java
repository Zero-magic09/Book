package com.village.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bank_account")
public class BankAccount {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "farmer_id", nullable = false)
    private Long farmerId;
    
    @Column(name = "bank_name", nullable = false, length = 50)
    private String bankName; // e.g., 工商银行
    
    @Column(name = "account_number", nullable = false, length = 30)
    private String accountNumber;
    
    @Column(name = "account_holder", nullable = false, length = 50)
    private String accountHolder; // 持卡人姓名
    
    @Column(name = "is_default")
    private Boolean isDefault = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
