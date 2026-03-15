package com.village.controller;

import com.village.dto.ApiResponse;
import com.village.dto.UserProfileDTO;
import com.village.security.SecurityUtils;
import com.village.entity.Address;
import com.village.entity.User;
import com.village.repository.AddressRepository;
import com.village.repository.FarmerRepository;
import com.village.repository.UserCouponRepository;
import com.village.repository.UserFavoriteRepository;
import com.village.repository.UserRepository;
import com.village.entity.UserFavorite;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final AddressRepository addressRepository;
    private final UserCouponRepository userCouponRepository;
    private final UserFavoriteRepository userFavoriteRepository;
    private final SecurityUtils securityUtils;

    @GetMapping("/{id}/profile")
    public ApiResponse<UserProfileDTO> getProfile(@PathVariable Long id) {
        if (!securityUtils.isUser(id)) {
            return ApiResponse.<UserProfileDTO>error(403, "无权访问此资料");
        }
        User user = userRepository.findById(id).orElse(null);
        
        UserProfileDTO dto = new UserProfileDTO();
        dto.setId(user.getId());
        dto.setName(user.getRealName());
        dto.setPhone(user.getPhone());
        dto.setAvatar(user.getAvatar());
        dto.setRole(user.getRole().name());
        dto.setFootprintCount(user.getFootprintCount() == null ? 0 : user.getFootprintCount());
        dto.setFavoritesCount(user.getFavoritesCount() == null ? 0 : user.getFavoritesCount());
        dto.setPoints(user.getPoints() == null ? 0 : user.getPoints());
        dto.setIdCard(user.getIdCard());
        
        if (user.getRole() == User.Role.FARMER) {
            farmerRepository.findByUserId(user.getId())
                    .ifPresent(farmer -> {
                        // 无论认证与否，统一显示为普通农户
                        dto.setRoleTag("普通农户");
                    });
            if (dto.getRoleTag() == null) {
                dto.setRoleTag("农户"); 
            }
        } else {
             dto.setRoleTag("普通用户");
        }
        
        if (dto.getRoleTag() == null) dto.setRoleTag("用户");

        return ApiResponse.success(dto);
    }

    @PutMapping("/{id}/profile")
    public ApiResponse<UserProfileDTO> updateProfile(@PathVariable Long id, @RequestBody UserProfileDTO request) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ApiResponse.<UserProfileDTO>error(404, "用户不存在");
        }
        
        if (request.getName() != null) user.setRealName(request.getName());
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar());
        
        userRepository.save(user);
        
        // 重新获取更新后的profile
        return getProfile(id);
    }

    /**
     * 获取用户服务摘要（地址数量、实名认证状态等）
     */
    @GetMapping("/{id}/services")
    public ApiResponse<Map<String, Object>> getServicesSummary(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ApiResponse.<Map<String, Object>>error(404, "用户不存在");
        }
        
        Map<String, Object> services = new HashMap<>();
        
        // 收货地址数量
        int addressCount = addressRepository.countByUserId(id);
        services.put("addressCount", addressCount);
        services.put("addressDesc", addressCount > 0 ? addressCount + "个地址" : "添加地址");
        
        // 实名认证状态
        boolean verified = user.getRealName() != null && !user.getRealName().isEmpty() 
                        && user.getIdCard() != null && !user.getIdCard().isEmpty();
        services.put("verified", verified);
        services.put("verifiedDesc", verified ? "已认证" : "去认证");
        
        // 优惠券数量 (查询真实数据：状态为0-未使用)
        int couponCount = userCouponRepository.countByUserIdAndStatus(id, 0);
        services.put("couponCount", couponCount);
        services.put("couponDesc", couponCount > 0 ? couponCount + "张可用" : "查看优惠");
        
        return ApiResponse.success(services);
    }

    // ==================== 用户互动及积分 ====================

    @PostMapping("/{id}/footprint")
    public ApiResponse<Integer> incrementFootprint(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ApiResponse.error(404, "用户不存在");
        
        user.setFootprintCount((user.getFootprintCount() == null ? 0 : user.getFootprintCount()) + 1);
        userRepository.save(user);
        return ApiResponse.success(user.getFootprintCount());
    }

    @PostMapping("/{id}/favorites")
    @org.springframework.transaction.annotation.Transactional
    public ApiResponse<Map<String, Object>> updateFavorites(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        if (!securityUtils.isUser(id)) return ApiResponse.error(403, "无权操作");
        
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ApiResponse.error(404, "用户不存在");
        
        Long productId = Long.valueOf(request.get("productId").toString());
        Boolean increment = (Boolean) request.get("increment");
        if (increment == null) increment = true;

        if (increment) {
            if (userFavoriteRepository.findByUserIdAndProductId(id, productId).isEmpty()) {
                UserFavorite favorite = new UserFavorite();
                favorite.setUserId(id);
                favorite.setProductId(productId);
                userFavoriteRepository.save(favorite);
                
                user.setFavoritesCount((user.getFavoritesCount() == null ? 0 : user.getFavoritesCount()) + 1);
                userRepository.save(user);
            }
        } else {
            userFavoriteRepository.findByUserIdAndProductId(id, productId).ifPresent(fav -> {
                userFavoriteRepository.delete(fav);
                user.setFavoritesCount(Math.max(0, (user.getFavoritesCount() == null ? 1 : user.getFavoritesCount()) - 1));
                userRepository.save(user);
            });
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("favoritesCount", user.getFavoritesCount());
        return ApiResponse.success(increment ? "已收藏" : "已取消收藏", result);
    }

    // ==================== 收货地址管理 ====================

    /**
     * 获取用户地址列表
     */
    @GetMapping("/{userId}/addresses")
    public ApiResponse<List<Address>> getUserAddresses(@PathVariable Long userId) {
        return ApiResponse.success(addressRepository.findByUserIdOrderByIsDefaultDesc(userId));
    }

    /**
     * 添加收货地址
     */
    @PostMapping("/{userId}/addresses")
    public ApiResponse<Address> addAddress(@PathVariable Long userId, @RequestBody Address address) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.<Address>error(404, "用户不存在");
        }
        
        address.setUser(user);
        // 如果是第一个地址，默认设为默认地址
        if (addressRepository.countByUserId(userId) == 0) {
            address.setIsDefault(true);
        }
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            clearDefaultAddress(userId);
        }
        return ApiResponse.success(addressRepository.save(address));
    }

    /**
     * 更新收货地址
     */
    @PutMapping("/{userId}/addresses/{addressId}")
    public ApiResponse<Address> updateAddress(
            @PathVariable Long userId,
            @PathVariable Long addressId,
            @RequestBody Address addressDetails) {
        Address address = addressRepository.findById(addressId).orElse(null);
        if (address == null) {
            return ApiResponse.<Address>error(404, "地址不存在");
        }
        
        if (!address.getUser().getId().equals(userId)) {
            return ApiResponse.<Address>error(403, "无权操作此地址");
        }
        address.setName(addressDetails.getName());
        address.setPhone(addressDetails.getPhone());
        address.setProvince(addressDetails.getProvince());
        address.setCity(addressDetails.getCity());
        address.setDistrict(addressDetails.getDistrict());
        address.setDetail(addressDetails.getAddress()); // 前端可能传detail或address，需统一
        if (addressDetails.getAddress() != null) address.setAddress(addressDetails.getAddress());
        if (addressDetails.getDetail() != null) address.setAddress(addressDetails.getDetail()); // 兼容前端字段

        if (Boolean.TRUE.equals(addressDetails.getIsDefault())) {
            clearDefaultAddress(userId);
            address.setIsDefault(true);
        }
        return ApiResponse.success(addressRepository.save(address));
    }

    /**
     * 删除收货地址
     */
    @DeleteMapping("/{userId}/addresses/{addressId}")
    public ApiResponse<String> deleteAddress(@PathVariable Long userId, @PathVariable Long addressId) {
        Address address = addressRepository.findById(addressId).orElse(null);
        if (address == null) {
            return ApiResponse.<String>error(404, "地址不存在");
        }
        
        if (!address.getUser().getId().equals(userId)) {
            return ApiResponse.<String>error(403, "无权操作此地址");
        }
        addressRepository.delete(address);
        return ApiResponse.success("地址已删除", "ok");
    }

    private void clearDefaultAddress(Long userId) {
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDesc(userId);
        for (Address addr : addresses) {
            if (Boolean.TRUE.equals(addr.getIsDefault())) {
                addr.setIsDefault(false);
                addressRepository.save(addr);
            }
        }
    }
}
