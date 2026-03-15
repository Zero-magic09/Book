package com.village.controller;

import com.village.dto.ApiResponse;
import com.village.security.JwtUtils;
import com.village.security.SecurityUtils;
import com.village.dto.LoginRequest;
import com.village.dto.RegisterRequest;
import com.village.entity.Farmer;
import com.village.entity.User;
import com.village.repository.FarmerRepository;
import com.village.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final SecurityUtils securityUtils;

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        String account = request.getUsername() != null ? request.getUsername() : request.getPhone();
        
        // 特殊处理：管理员固定账号登录 (不查数据库)
        if ("admin".equals(account) && "admin".equals(request.getPassword())) {
            Map<String, Object> data = new HashMap<>();
            data.put("userId", 0L); // 特殊 ID
            data.put("phone", "admin");
            data.put("role", "ADMIN");
            data.put("realName", "系统管理员");
            
            // 生成管理员 Token
            String token = jwtUtils.generateToken(0L, "admin", "ADMIN");
            data.put("token", token);
            
            return ApiResponse.success("登录成功", data);
        }

        if (account == null) {
            return ApiResponse.<Map<String, Object>>error(400, "账号不能为空");
        }

        User user = userRepository.findByPhone(account)
            .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPassword()))
            .orElse(null);
        
        if (user == null) {
            return ApiResponse.<Map<String, Object>>error(401, "账号或密码错误");
        }

        if (user.getStatus() == User.Status.DISABLED) {
            return ApiResponse.<Map<String, Object>>error(403, "账号被禁用");
        }
        
        return generateLoginResponse(user);
    }

    private ApiResponse<Map<String, Object>> generateLoginResponse(User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("phone", user.getPhone());
        data.put("role", user.getRole().name());
        data.put("realName", user.getRealName());
        
        String token = jwtUtils.generateToken(user.getId(), user.getPhone(), user.getRole().name());
        data.put("token", token);
        
        if (user.getRole() == User.Role.FARMER) {
            farmerRepository.findByUserId(user.getId())
                .ifPresent(farmer -> data.put("farmerId", farmer.getId()));
        }
        
        return ApiResponse.success("登录成功", data);
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            return ApiResponse.<Map<String, Object>>error(400, "手机号已注册");
        }

        User user = new User();
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setRealName(request.getRealName());
        
        // 设置默认头像
        if (request.getRole() == User.Role.FARMER) {
            user.setAvatar("/uploads/farmers.jpg");
        } else {
            user.setAvatar("/uploads/consumer.jpg");
        }
        
        user = userRepository.save(user);

        // 如果是农户注册，创建农户信息
        if (request.getRole() == User.Role.FARMER) {
            Farmer farmer = new Farmer();
            farmer.setUser(user);
            farmer.setFarmName(request.getFarmName());
            farmer.setProvince(request.getProvince());
            farmer.setCity(request.getCity());
            farmer.setAddress(request.getAddress());
            farmer.setVerified(false); // Explicitly set to false
            farmerRepository.save(farmer);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("phone", user.getPhone());
        data.put("role", user.getRole());

        return ApiResponse.success("注册成功", data);
    }

    @PostMapping("/realname")
    public ApiResponse<String> realname(
            @RequestParam(required = false) Long userId, // Check compatibility but ignore
            @RequestParam String realName,
            @RequestParam String idCard) {
        
        Long currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ApiResponse.<String>error(401, "请先登录");
        }

        User user = userRepository.findById(currentUserId).orElse(null);
        if (user == null) {
            return ApiResponse.<String>error(404, "用户不存在");
        }
        
        user.setRealName(realName);
        user.setIdCard(idCard);
        userRepository.save(user);
        return ApiResponse.success("实名认证成功", "ok");
    }
}
