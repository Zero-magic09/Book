package com.village.dto;

import com.village.entity.User;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "手机号不能为空")
    private String phone;
    
    @NotBlank(message = "密码不能为空")
    private String password;
    
    private User.Role role = User.Role.CONSUMER;
    
    private String realName;
    
    // 农户注册额外字段
    private String farmName;
    private String province;
    private String city;
    private String address;
}
