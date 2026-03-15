package com.village.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    private String phone;
    private String username;
    
    @NotBlank(message = "密码不能为空")
    private String password;
}
