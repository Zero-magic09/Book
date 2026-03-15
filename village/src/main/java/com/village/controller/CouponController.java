package com.village.controller;

import com.village.dto.ApiResponse;
import com.village.security.SecurityUtils;
import com.village.entity.Coupon;
import com.village.entity.User;
import com.village.entity.UserCoupon;
import com.village.repository.CouponRepository;
import com.village.repository.UserCouponRepository;
import com.village.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    /**
     * 领券中心：获取可领取的优惠券
     */
    @GetMapping("/market")
    public ApiResponse<List<Map<String, Object>>> getMarketCoupons(@RequestParam(required = false) Long userId) {
        List<Coupon> coupons = couponRepository.findAvailableCoupons();
        
        List<Map<String, Object>> result = coupons.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("type", c.getType());
            map.put("value", c.getValue());
            map.put("minSpend", c.getMinSpend());
            map.put("startTime", c.getStartTime());
            map.put("endTime", c.getEndTime());
            map.put("remaining", c.getRemainingCount());
            
            // 优先使用当前登录用户ID
            Long currentUserId = securityUtils.getCurrentUserId();
            if (currentUserId == null) {
                currentUserId = userId; // Fallback to param if not logged in
            }

            // 如果有用户ID，检查是否已领取
            if (currentUserId != null) {
                boolean claimed = userCouponRepository.existsByUserIdAndCouponId(currentUserId, c.getId());
                map.put("claimed", claimed);
            } else {
                map.put("claimed", false);
            }
            return map;
        }).collect(Collectors.toList());
        
        return ApiResponse.success(result);
    }

    /**
     * 我的卡券：获取用户已领取的优惠券
     */
    @GetMapping("/my")
    public ApiResponse<List<Map<String, Object>>> getMyCoupons(@RequestParam Long userId, @RequestParam(defaultValue = "0") Integer status) {
        if (!securityUtils.isUser(userId)) {
            return ApiResponse.<List<Map<String, Object>>>error(403, "无权访问");
        }
        // status: 0-unused, 1-used, 2-expired, 3-all
        List<UserCoupon> list;
        if (status == 3) {
            list = userCouponRepository.findByUserIdOrderByGetTimeDesc(userId);
        } else {
            list = userCouponRepository.findByUserIdAndStatus(userId, status);
        }
        
        List<Map<String, Object>> result = list.stream().map(uc -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", uc.getId()); // user_coupon id
            map.put("couponId", uc.getCoupon().getId());
            map.put("name", uc.getCoupon().getName());
            map.put("type", uc.getCoupon().getType());
            map.put("value", uc.getCoupon().getValue());
            map.put("minSpend", uc.getCoupon().getMinSpend());
            map.put("startTime", uc.getCoupon().getStartTime());
            map.put("endTime", uc.getCoupon().getEndTime());
            map.put("status", uc.getStatus());
            return map;
        }).collect(Collectors.toList());
        
        return ApiResponse.success(result);
    }

    /**
     * 领取优惠券
     */
    @PostMapping("/{id}/claim")
    public ApiResponse<String> claimCoupon(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long userId = securityUtils.getCurrentUserId();
        if (userId == null) {
            return ApiResponse.<String>error(401, "请先登录");
        }

        Coupon coupon = couponRepository.findById(id).orElse(null);
        if (coupon == null) {
            return ApiResponse.<String>error(404, "优惠券不存在");
        }
        
        if (coupon.getRemainingCount() <= 0) {
            return ApiResponse.<String>error(400, "优惠券已领完");
        }
        if (coupon.getEndTime().isBefore(LocalDateTime.now())) {
            return ApiResponse.<String>error(400, "优惠券已过期");
        }
        if (userCouponRepository.existsByUserIdAndCouponId(userId, id)) {
            return ApiResponse.<String>error(400, "您已领取过该优惠券");
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.<String>error(404, "用户不存在");
        }
        
        // 扣减库存
        coupon.setRemainingCount(coupon.getRemainingCount() - 1);
        couponRepository.save(coupon);
        
        // 创建领取记录
        UserCoupon uc = new UserCoupon();
        uc.setUser(user);
        uc.setCoupon(coupon);
        uc.setStatus(0); // unused
        userCouponRepository.save(uc);
        
        return ApiResponse.success("领取成功", "ok");
    }
}
