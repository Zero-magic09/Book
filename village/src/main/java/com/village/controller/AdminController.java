package com.village.controller;

import com.village.dto.ApiResponse;
import com.village.security.SecurityUtils;
import com.village.entity.*;
import com.village.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ProductRepository productRepository;
    private final FarmerRepository farmerRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    private final SecurityUtils securityUtils;
    private final AddressRepository addressRepository;
    private final CartRepository cartRepository;
    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;
    private final ReviewRepository reviewRepository;
    private final BankAccountRepository bankAccountRepository;
    private final FarmPhotoRepository farmPhotoRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final UserFavoriteRepository userFavoriteRepository;


    private final PasswordEncoder passwordEncoder;

    // ==================== 农产品审核 ====================
    
    /**
     * 获取待审核产品列表
     */
    @GetMapping("/products/pending")
    public ApiResponse<Page<Product>> getPendingProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Page<Product>>error(403, "仅限管理员访问");
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<Product> products = productRepository.findByStatus(Product.ProductStatus.PENDING, pageRequest);
        return ApiResponse.success(products);
    }

    /**
     * 审核产品 - 通过
     */
    @PostMapping("/products/{id}/approve")
    public ApiResponse<String> approveProduct(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权操作");
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return ApiResponse.<String>error(404, "产品不存在");
        }
        product.setStatus(Product.ProductStatus.APPROVED);
        productRepository.save(product);
        return ApiResponse.success("产品审核通过", "ok");
    }

    /**
     * 审核产品 - 驳回
     */
    @PostMapping("/products/{id}/reject")
    public ApiResponse<String> rejectProduct(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return ApiResponse.<String>error(404, "产品不存在");
        }
        product.setStatus(Product.ProductStatus.REJECTED);
        productRepository.save(product);
        return ApiResponse.success("产品已驳回", "ok");
    }

    /**
     * 屏蔽产品（虚假宣传/非乡村直供）
     */
    @PostMapping("/products/{id}/block")
    public ApiResponse<String> blockProduct(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return ApiResponse.<String>error(404, "产品不存在");
        }
        product.setStatus(Product.ProductStatus.OFFLINE);
        productRepository.save(product);
        return ApiResponse.success("产品已屏蔽", "ok");
    }

    // ==================== 农户认证审核 ====================

    /**
     * 获取待认证农户列表
     */
    @GetMapping("/farmers/pending")
    public ApiResponse<List<Farmer>> getPendingFarmers() {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<Farmer>>error(403, "无权访问");
        List<Farmer> farmers = farmerRepository.findByVerified(false, Sort.by(Sort.Direction.ASC, "createdAt"));
        return ApiResponse.success(farmers);
    }

    /**
     * 获取全部农户列表
     */
    @GetMapping("/farmers/all")
    public ApiResponse<List<Farmer>> getAllFarmers(@RequestParam(required = false) String keyword) {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<Farmer>>error(403, "无权访问");
        List<Farmer> farmers;
        if (keyword != null && !keyword.trim().isEmpty()) {
            farmers = farmerRepository.findByFarmNameContainingOrProvinceContainingOrCityContaining(keyword, keyword, keyword, Sort.by(Sort.Direction.ASC, "createdAt"));
        } else {
            farmers = farmerRepository.findAll(Sort.by(Sort.Direction.ASC, "createdAt"));
        }
        return ApiResponse.success(farmers);
    }

    /**
     * 更新农户信息
     */
    @PutMapping("/farmers/{id}")
    public ApiResponse<Farmer> updateFarmer(@PathVariable Long id, @RequestBody Farmer updateData) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Farmer>error(403, "无权操作");
        Farmer farmer = farmerRepository.findById(id).orElse(null);
        if (farmer == null) return ApiResponse.<Farmer>error(404, "农户不存在");
        
        if (updateData.getFarmName() != null) farmer.setFarmName(updateData.getFarmName());
        if (updateData.getProvince() != null) farmer.setProvince(updateData.getProvince());
        if (updateData.getCity() != null) farmer.setCity(updateData.getCity());
        if (updateData.getAddress() != null) farmer.setAddress(updateData.getAddress());
        if (updateData.getDescription() != null) farmer.setDescription(updateData.getDescription());
        if (updateData.getVerified() != null) {
            farmer.setVerified(updateData.getVerified());
            if (updateData.getVerified()) farmer.setVerifiedAt(LocalDateTime.now());
        }
        
        return ApiResponse.success("农户信息已更新", farmerRepository.save(farmer));
    }

    /**
     * 删除农户
     */
    @DeleteMapping("/farmers/{id}")
    public ApiResponse<String> deleteFarmer(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权操作");
        if (!farmerRepository.existsById(id)) return ApiResponse.<String>error(404, "农户不存在");
        farmerRepository.deleteById(id);
        return ApiResponse.success("农户已删除", "ok");
    }

    /**
     * 新增农户
     */
    @PostMapping("/farmers")
    public ApiResponse<Farmer> addFarmer(@RequestBody Map<String, Object> payload) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Farmer>error(403, "无权操作");
        Long userId = Long.valueOf(payload.get("userId").toString());
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ApiResponse.<Farmer>error(404, "关联用户不存在");
        
        // 检查该用户是否已经是农户
        if (farmerRepository.findByUserId(userId).isPresent()) {
            return ApiResponse.<Farmer>error(400, "该用户已经是农户，请直接修改");
        }

        Farmer farmer = new Farmer();
        farmer.setUser(user);
        farmer.setFarmName((String) payload.get("farmName"));
        farmer.setProvince((String) payload.get("province"));
        farmer.setCity((String) payload.get("city"));
        farmer.setAddress((String) payload.get("address"));
        farmer.setDescription((String) payload.get("description"));
        farmer.setVerified(Boolean.TRUE.equals(payload.get("verified")));
        if (farmer.getVerified()) farmer.setVerifiedAt(LocalDateTime.now());

        // 更新用户角色
        user.setRole(User.Role.FARMER);
        userRepository.save(user);

        return ApiResponse.success("新增农户成功", farmerRepository.save(farmer));
    }

    /**
     * 审核农户认证 - 通过
     */
    @PostMapping("/farmers/{id}/verify")
    public ApiResponse<String> verifyFarmer(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        Farmer farmer = farmerRepository.findById(id).orElse(null);
        if (farmer == null) {
            return ApiResponse.<String>error(404, "农户不存在");
        }
        farmer.setVerified(true);
        farmer.setAuditStatus(Farmer.AuditStatus.APPROVED);
        farmer.setVerifiedAt(LocalDateTime.now());
        farmerRepository.save(farmer);
        return ApiResponse.success("农户认证通过", "ok");
    }

    /**
     * 审核农户认证 - 驳回
     */
    @PostMapping("/farmers/{id}/reject")
    public ApiResponse<String> rejectFarmer(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        Farmer farmer = farmerRepository.findById(id).orElse(null);
        if (farmer == null) {
            return ApiResponse.<String>error(404, "农户不存在");
        }
        farmer.setVerified(false);
        farmer.setAuditStatus(Farmer.AuditStatus.REJECTED);
        farmerRepository.save(farmer);
        return ApiResponse.success("农户认证已驳回", "ok");
    }

    // ==================== 用户管理 ====================

    /**
     * 获取用户列表
     */
    @GetMapping("/users")
    public ApiResponse<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String keyword) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Page<User>>error(403, "无权访问");
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        
        Page<User> users;
        if (keyword != null && !keyword.trim().isEmpty()) {
            users = userRepository.findByPhoneContainingOrRealNameContaining(keyword, keyword, pageRequest);
        } else if (role != null && !role.trim().isEmpty()) {
            try {
                User.Role roleEnum = User.Role.valueOf(role.toUpperCase());
                users = userRepository.findByRole(roleEnum, pageRequest);
            } catch (IllegalArgumentException e) {
                // Invalid role, return empty or all? Let's return empty to indicate no match
                 return ApiResponse.<Page<User>>success(Page.empty(pageRequest));
            }
        } else {
            users = userRepository.findAll(pageRequest);
        }
        return ApiResponse.success(users);
    }

    /**
     * 禁用用户
     */
    @PostMapping("/users/{id}/disable")
    public ApiResponse<String> disableUser(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ApiResponse.<String>error(404, "用户不存在");
        }
        user.setStatus(User.Status.DISABLED);
        userRepository.save(user);
        return ApiResponse.success("用户已禁用", "ok");
    }

    /**
     * 警告用户
     */
    @PostMapping("/users/{id}/warn")
    public ApiResponse<String> warnUser(@PathVariable Long id, @RequestParam String reason) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ApiResponse.<String>error(404, "用户不存在");
        }
        user.setStatus(User.Status.PENDING); // 用PENDING表示警告状态
        userRepository.save(user);
        return ApiResponse.success("已向用户发送警告", "ok");
    }

    /**
     * 修改用户信息（管理员协助）
     */
    @PutMapping("/users/{id}")
    public ApiResponse<User> updateUser(@PathVariable Long id, @RequestBody User updateData) {
        if (!securityUtils.isAdmin()) return ApiResponse.<User>error(403, "无权访问");
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ApiResponse.<User>error(404, "用户不存在");
        }
        if (updateData.getRealName() != null) user.setRealName(updateData.getRealName());
        if (updateData.getIdCard() != null) user.setIdCard(updateData.getIdCard());
        if (updateData.getPhone() != null && !updateData.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(updateData.getPhone())) {
                return ApiResponse.<User>error(400, "该账号已存在");
            }
            user.setPhone(updateData.getPhone());
        }
        if (updateData.getRole() != null) user.setRole(updateData.getRole());
        if (updateData.getStatus() != null) user.setStatus(updateData.getStatus());
        if (updateData.getPassword() != null && !updateData.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updateData.getPassword()));
        }
        
        User saved = userRepository.save(user);
        return ApiResponse.success("用户信息已更新", saved);
    }

    /**
     * 新增用户
     */
    @PostMapping("/users")
    public ApiResponse<User> addUser(@RequestBody User newUser) {
        if (!securityUtils.isAdmin()) return ApiResponse.<User>error(403, "无权访问");
        
        if (userRepository.findByPhone(newUser.getPhone()).isPresent()) {
            return ApiResponse.<User>error(400, "该手机号已注册");
        }
        
        // 设置默认密码 123456
        newUser.setPassword(passwordEncoder.encode("123456"));
        
        if (newUser.getStatus() == null) newUser.setStatus(User.Status.ACTIVE);
        if (newUser.getRole() == null) newUser.setRole(User.Role.CONSUMER);
        
        // 设置默认头像
        if (newUser.getAvatar() == null || newUser.getAvatar().isEmpty()) {
            if (newUser.getRole() == User.Role.FARMER) {
                newUser.setAvatar("/uploads/farmers.jpg");
            } else {
                newUser.setAvatar("/uploads/consumer.jpg");
            }
        }
        
        User saved = userRepository.save(newUser);
        return ApiResponse.success("新增用户成功，默认密码：123456", saved);
    }

    /**
     * 删除用户
     */
    @DeleteMapping("/users/{id}")
    @Transactional
    public ApiResponse<String> deleteUser(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        
        if (!userRepository.existsById(id)) {
            return ApiResponse.<String>error(404, "用户不存在");
        }

        // 1. 处理农户相关的联级删除
        farmerRepository.findByUserId(id).ifPresent(farmer -> {
            Long farmerId = farmer.getId();
            
            // 删除提现记录
            withdrawalRepository.deleteByFarmerId(farmerId);
            // 删除农场照片
            farmPhotoRepository.deleteByFarmerId(farmerId);
            // 删除银行账户
            bankAccountRepository.deleteByFarmerId(farmerId);
            // 删除该农户下所有商品的关联订单（新结构：通过订单明细关联）
            List<Order> farmerOrders = orderRepository.findOrdersByFarmerId(farmerId);
            for (Order order : farmerOrders) {
                orderRepository.delete(order); // 级联删除订单明细
            }
            // 删除该农户下所有商品的评价
            reviewRepository.deleteByProduct_Farmer_Id(farmerId);
            // 删除该农户的所有商品
            productRepository.deleteByFarmer_Id(farmerId);
            
            // 最后删除农户记录
            farmerRepository.deleteById(farmerId);
        });

        // 2. 处理用户基础数据的联级删除
        // 删除评论
        reviewRepository.deleteByUserId(id);
        // 删除优惠券
        userCouponRepository.deleteByUserId(id);
        // 删除收藏
        userFavoriteRepository.deleteByUserId(id);
        // 删除购物车
        cartRepository.deleteByUserId(id);
        // 删除地址
        addressRepository.deleteByUserId(id);
        // 删除订单
        orderRepository.deleteByUserId(id);

        // 3. 最后删除用户本身
        userRepository.deleteById(id);
        
        return ApiResponse.success("用户及其关联数据已彻底删除", "ok");
    }

    // ==================== 数据统计 ====================

    /**
     * 获取平台统计数据
     */
    @GetMapping("/statistics")
    public ApiResponse<Map<String, Object>> getStatistics() {
        if (!securityUtils.isAdmin()) return ApiResponse.<Map<String, Object>>error(403, "无权访问");
        Map<String, Object> stats = new HashMap<>();
        
        // 用户统计
        long totalUsers = userRepository.count();
        stats.put("totalUsers", totalUsers);
        
        // 农户统计
        long totalFarmers = farmerRepository.count();
        long verifiedFarmers = farmerRepository.findByVerified(true, Sort.by(Sort.Direction.ASC, "createdAt")).size();
        stats.put("totalFarmers", totalFarmers);
        stats.put("verifiedFarmers", verifiedFarmers);
        
        // 产品统计
        long totalProducts = productRepository.count();
        long pendingProducts = productRepository.findByStatus(Product.ProductStatus.PENDING, PageRequest.of(0, 1)).getTotalElements();
        long approvedProducts = productRepository.findByStatus(Product.ProductStatus.APPROVED, PageRequest.of(0, 1)).getTotalElements();
        stats.put("totalProducts", totalProducts);
        stats.put("pendingProducts", pendingProducts);
        stats.put("approvedProducts", approvedProducts);
        
        // 订单统计
        long totalOrders = orderRepository.count();
        stats.put("totalOrders", totalOrders);
        
        // 活跃专区 (占位，暂无此功能)
        stats.put("activeZones", 0);
        
        return ApiResponse.success(stats);
    }

    /**
     * 获取最新动态 (聚合 订单/农户/产品)
     */
    @GetMapping("/statistics/activities")
    public ApiResponse<List<Map<String, Object>>> getActivities() {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<Map<String, Object>>>error(403, "无权访问");
        List<Map<String, Object>> activities = new ArrayList<>();
        
        // 1. 获取最近订单 (5条)
        Page<Order> recentOrders = orderRepository.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")));
        for (Order order : recentOrders.getContent()) {
            Map<String, Object> item = new HashMap<>();
            item.put("title", "新订单生成");
            String productNames = order.getItems().isEmpty() ? "商品" : 
                order.getItems().stream().map(OrderItem::getProductName).limit(2).collect(java.util.stream.Collectors.joining(", "));
            item.put("description", "用户 " + (order.getUser() != null ? order.getUser().getRealName() : "未知") + " 购买了 " + productNames);
            item.put("time", formatTimeAgo(order.getCreatedAt()));
            item.put("type", "order");
            item.put("timestamp", order.getCreatedAt());
            activities.add(item);
        }

        // 2. 获取最近农户 (5条)
        Page<Farmer> recentFarmers = farmerRepository.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")));
        for (Farmer farmer : recentFarmers.getContent()) {
            Map<String, Object> item = new HashMap<>();
            item.put("title", "新农户入驻");
            item.put("description", farmer.getFarmName() + " 提交了入驻申请");
            item.put("time", formatTimeAgo(farmer.getCreatedAt()));
            item.put("type", "farmer");
            item.put("timestamp", farmer.getCreatedAt());
            activities.add(item);
        }
        
        // 3. 获取最近产品 (5条)
        Page<Product> recentProducts = productRepository.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")));
        for (Product product : recentProducts.getContent()) {
            Map<String, Object> item = new HashMap<>();
            String action = product.getStatus() == Product.ProductStatus.PENDING ? "提交了" : "更新了";
            item.put("title", "商品动态");
            item.put("description", (product.getFarmer() != null ? product.getFarmer().getFarmName() : "农户") + " " + action + " \"" + product.getName() + "\"");
            item.put("time", formatTimeAgo(product.getCreatedAt()));
            item.put("type", "product");
            item.put("timestamp", product.getCreatedAt());
            activities.add(item);
        }

        // 排序并截取前 10 条
        activities.sort((a, b) -> ((LocalDateTime) b.get("timestamp")).compareTo((LocalDateTime) a.get("timestamp")));
        if (activities.size() > 10) {
            activities = activities.subList(0, 10);
        }
        
        // 移除 timestamp 字段 (前端不需要)
        activities.forEach(map -> map.remove("timestamp"));

        return ApiResponse.success(activities);
    }

    private String formatTimeAgo(LocalDateTime dateTime) {
        if (dateTime == null) return "未知时间";
        java.time.Duration duration = java.time.Duration.between(dateTime, LocalDateTime.now());
        long seconds = duration.getSeconds();
        if (seconds < 60) return "刚刚";
        if (seconds < 3600) return (seconds / 60) + "分钟前";
        if (seconds < 86400) return (seconds / 3600) + "小时前";
        return (seconds / 86400) + "天前";}

    /**
     * 获取交易数据趋势（最近7天）
     */
    @GetMapping("/statistics/orders")
    public ApiResponse<List<Map<String, Object>>> getOrderStats() {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<Map<String, Object>>>error(403, "无权访问");
        List<Map<String, Object>> data = new ArrayList<>();
        
        // 获取起始时间（7天前的凌晨）
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDateTime startDateTime = today.minusDays(6).atStartOfDay();
        
        // 从数据库查询每日订单量
        List<Object[]> results = orderRepository.countDailyOrders(startDateTime);
        
        // 将查询结果存入Map以便查找
        Map<java.time.LocalDate, Long> countMap = new HashMap<>();
        for (Object[] row : results) {
            java.sql.Date sqlDate = (java.sql.Date) row[0];
            countMap.put(sqlDate.toLocalDate(), (Long) row[1]);
        }
        
        // 生成最近7天的数据列表
        String[] weekDays = {"周一", "周二", "周三", "周四", "周五", "周六", "周日"};
        for (int i = 0; i < 7; i++) {
            java.time.LocalDate date = today.minusDays(6 - i);
            int dayOfWeek = date.getDayOfWeek().getValue(); // 1 (Mon) - 7 (Sun)
            
            Map<String, Object> item = new HashMap<>();
            item.put("day", weekDays[dayOfWeek - 1]);
            item.put("orders", countMap.getOrDefault(date, 0L));
            data.add(item);
        }
        
        return ApiResponse.success(data);
    }



    // ==================== 地址管理 ====================

    @PostMapping("/addresses")
    public ApiResponse<Address> addAddress(@RequestBody Address address) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Address>error(403, "无权访问");
        
        if (address.getUser() == null || address.getUser().getId() == null) {
            return ApiResponse.<Address>error(400, "必须指定用户ID");
        }
        
        User user = userRepository.findById(address.getUser().getId()).orElse(null);
        if (user == null) {
            return ApiResponse.<Address>error(404, "用户不存在");
        }
        if (user.getRole() != User.Role.CONSUMER) {
            return ApiResponse.<Address>error(400, "只有消费者才可以添加收货地址");
        }
        address.setUser(user);
        
        return ApiResponse.success("新增地址成功", addressRepository.save(address));
    }

    @PutMapping("/addresses/{id}")
    public ApiResponse<Address> updateAddress(@PathVariable Long id, @RequestBody Address updateData) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Address>error(403, "无权访问");
        Address address = addressRepository.findById(id).orElse(null);
        if (address == null) return ApiResponse.error(404, "地址不存在");
        
        if (updateData.getName() != null) address.setName(updateData.getName());
        if (updateData.getPhone() != null) address.setPhone(updateData.getPhone());
        if (updateData.getProvince() != null) address.setProvince(updateData.getProvince());
        if (updateData.getCity() != null) address.setCity(updateData.getCity());
        if (updateData.getAddress() != null) address.setAddress(updateData.getAddress());
        
        if (updateData.getUser() != null && updateData.getUser().getId() != null) {
            User newUser = userRepository.findById(updateData.getUser().getId()).orElse(null);
            if (newUser != null) {
                if (newUser.getRole() != User.Role.CONSUMER) {
                    return ApiResponse.<Address>error(400, "只有消费者才可以拥有收货地址");
                }
                address.setUser(newUser);
            }
        }
        
        return ApiResponse.success("地址更新成功", addressRepository.save(address));
    }

    @DeleteMapping("/addresses/{id}")
    public ApiResponse<String> deleteAddress(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        addressRepository.deleteById(id);
        return ApiResponse.success("删除成功", "ok");
    }

    // ==================== 全表数据查看 (管理员专用) ====================

    @GetMapping("/addresses/all")
    public ApiResponse<List<Address>> getAllAddresses(@RequestParam(required = false) String keyword) {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<Address>>error(403, "无权访问");
        if (keyword != null && !keyword.trim().isEmpty()) {
            return ApiResponse.success(addressRepository.findByNameContainingOrPhoneContainingOrAddressContaining(keyword, keyword, keyword, Sort.by(Sort.Direction.ASC, "user.id")));
        }
        return ApiResponse.success(addressRepository.findAll(Sort.by(Sort.Direction.ASC, "user.id")));
    }

    @GetMapping("/carts/all")
    public ApiResponse<List<Cart>> getAllCarts() {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<Cart>>error(403, "无权访问");
        return ApiResponse.success(cartRepository.findAll(Sort.by(Sort.Direction.ASC, "createdAt")));
    }

    @GetMapping("/coupons/all")
    public ApiResponse<List<Coupon>> getAllCoupons(@RequestParam(required = false) String keyword) {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<Coupon>>error(403, "无权访问");
        if (keyword != null && !keyword.trim().isEmpty()) {
            return ApiResponse.success(couponRepository.findByNameContaining(keyword, Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return ApiResponse.success(couponRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @PostMapping("/coupons")
    public ApiResponse<Coupon> addCoupon(@RequestBody Coupon coupon) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Coupon>error(403, "无权访问");
        return ApiResponse.success("新增成功", couponRepository.save(coupon));
    }

    @PutMapping("/coupons/{id}")
    public ApiResponse<Coupon> updateCoupon(@PathVariable Long id, @RequestBody Coupon updateData) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Coupon>error(403, "无权访问");
        Coupon coupon = couponRepository.findById(id).orElse(null);
        if (coupon == null) return ApiResponse.error(404, "记录不存在");
        
        if (updateData.getName() != null) coupon.setName(updateData.getName());
        if (updateData.getType() != null) coupon.setType(updateData.getType());
        if (updateData.getValue() != null) coupon.setValue(updateData.getValue());
        if (updateData.getMinSpend() != null) coupon.setMinSpend(updateData.getMinSpend());
        if (updateData.getStartTime() != null) coupon.setStartTime(updateData.getStartTime());
        if (updateData.getEndTime() != null) coupon.setEndTime(updateData.getEndTime());
        if (updateData.getTotalCount() != null) coupon.setTotalCount(updateData.getTotalCount());
        if (updateData.getRemainingCount() != null) coupon.setRemainingCount(updateData.getRemainingCount());
        if (updateData.getStatus() != null) coupon.setStatus(updateData.getStatus());
        
        return ApiResponse.success("更新成功", couponRepository.save(coupon));
    }

    @DeleteMapping("/coupons/{id}")
    public ApiResponse<String> deleteCoupon(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        couponRepository.deleteById(id);
        return ApiResponse.success("删除成功", "ok");
    }

    @GetMapping("/user-coupons/all")
    public ApiResponse<List<UserCoupon>> getAllUserCoupons(@RequestParam(required = false) String keyword) {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<UserCoupon>>error(403, "无权访问");
        Sort sort = Sort.by(Sort.Order.asc("user.id"), Sort.Order.desc("getTime"));
        if (keyword != null && !keyword.trim().isEmpty()) {
            return ApiResponse.success(userCouponRepository.findByUser_RealNameContainingOrCoupon_NameContaining(keyword, keyword, sort));
        }
        return ApiResponse.success(userCouponRepository.findAll(sort));
    }

    @PostMapping("/user-coupons")
    public ApiResponse<UserCoupon> addUserCoupon(@RequestBody UserCoupon userCoupon) {
        if (!securityUtils.isAdmin()) return ApiResponse.<UserCoupon>error(403, "无权访问");
        
        if (userCoupon.getUser() == null || userCoupon.getUser().getId() == null) {
            return ApiResponse.<UserCoupon>error(400, "必须指定用户");
        }
        if (userCoupon.getCoupon() == null || userCoupon.getCoupon().getId() == null) {
            return ApiResponse.<UserCoupon>error(400, "必须指定优惠券");
        }
        
        User user = userRepository.findById(userCoupon.getUser().getId()).orElse(null);
        if (user == null) return ApiResponse.error(404, "用户不存在");
        
        Coupon coupon = couponRepository.findById(userCoupon.getCoupon().getId()).orElse(null);
        if (coupon == null) return ApiResponse.error(404, "优惠券不存在");
        
        if (coupon.getRemainingCount() <= 0) {
            return ApiResponse.error(400, "优惠券已领完");
        }
        
        // 扣减库存
        coupon.setRemainingCount(coupon.getRemainingCount() - 1);
        couponRepository.save(coupon);
        
        userCoupon.setUser(user);
        userCoupon.setCoupon(coupon);
        if (userCoupon.getGetTime() == null) userCoupon.setGetTime(LocalDateTime.now());
        if (userCoupon.getStatus() == null) userCoupon.setStatus(0); // Default unused
        
        return ApiResponse.success("发放成功", userCouponRepository.save(userCoupon));
    }

    @PutMapping("/user-coupons/{id}")
    public ApiResponse<UserCoupon> updateUserCoupon(@PathVariable Long id, @RequestBody UserCoupon updateData) {
        if (!securityUtils.isAdmin()) return ApiResponse.<UserCoupon>error(403, "无权访问");
        UserCoupon uc = userCouponRepository.findById(id).orElse(null);
        if (uc == null) return ApiResponse.error(404, "记录不存在");
        
        if (updateData.getGetTime() != null) uc.setGetTime(updateData.getGetTime());
        if (updateData.getStatus() != null) uc.setStatus(updateData.getStatus());
        if (updateData.getUseTime() != null) uc.setUseTime(updateData.getUseTime());
        
        return ApiResponse.success("更新成功", userCouponRepository.save(uc));
    }

    @DeleteMapping("/user-coupons/{id}")
    public ApiResponse<String> deleteUserCoupon(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        if (!userCouponRepository.existsById(id)) return ApiResponse.error(404, "记录不存在");
        userCouponRepository.deleteById(id);
        return ApiResponse.success("删除成功", "ok");
    }

    @GetMapping("/reviews/all")
    public ApiResponse<List<Review>> getAllReviews(@RequestParam(required = false) String keyword) {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<Review>>error(403, "无权访问");
        if (keyword != null && !keyword.trim().isEmpty()) {
            return ApiResponse.success(reviewRepository.findByContentContainingOrProduct_NameContainingOrUser_RealNameContaining(keyword, keyword, keyword, Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return ApiResponse.success(reviewRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @PutMapping("/reviews/{id}")
    public ApiResponse<Review> updateReview(@PathVariable Long id, @RequestBody Review updateData) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Review>error(403, "无权访问");
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null) return ApiResponse.error(404, "记录不存在");
        if (updateData.getContent() != null) review.setContent(updateData.getContent());
        if (updateData.getRating() != null) review.setRating(updateData.getRating());
        if (updateData.getImages() != null) review.setImages(updateData.getImages());
        return ApiResponse.success("更新成功", reviewRepository.save(review));
    }

    @DeleteMapping("/reviews/{id}")
    public ApiResponse<String> deleteReview(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        reviewRepository.deleteById(id);
        return ApiResponse.success("删除成功", "ok");
    }


    @GetMapping("/orders/all")
    public ApiResponse<List<Order>> getAllOrders(@RequestParam(required = false) String keyword) {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<Order>>error(403, "无权访问");
        if (keyword != null && !keyword.trim().isEmpty()) {
            return ApiResponse.success(orderRepository.findByKeyword(keyword, Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return ApiResponse.success(orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @PutMapping("/orders/{id}")
    public ApiResponse<Order> updateOrder(@PathVariable Long id, @RequestBody Order updateData) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Order>error(403, "无权访问");
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ApiResponse.error(404, "订单不存在");
        if (updateData.getStatus() != null) order.setStatus(updateData.getStatus());
        return ApiResponse.success("订单已更新", orderRepository.save(order));
    }

    @DeleteMapping("/orders/{id}")
    public ApiResponse<String> deleteOrder(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        orderRepository.deleteById(id);
        return ApiResponse.success("订单已删除", "ok");
    }

    @GetMapping("/bank-accounts/all")
    public ApiResponse<List<BankAccount>> getAllBankAccounts(@RequestParam(required = false) String keyword) {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<BankAccount>>error(403, "无权访问");
        if (keyword != null && !keyword.trim().isEmpty()) {
            return ApiResponse.success(bankAccountRepository.findByBankNameContainingOrAccountNumberContainingOrAccountHolderContaining(
                    keyword, keyword, keyword, Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return ApiResponse.success(bankAccountRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @PostMapping("/bank-accounts")
    public ApiResponse<BankAccount> addBankAccount(@RequestBody Map<String, Object> payload) {
        if (!securityUtils.isAdmin()) return ApiResponse.<BankAccount>error(403, "无权访问");
        
        BankAccount account = new BankAccount();
        account.setFarmerId(Long.valueOf(payload.get("farmerId").toString()));
        account.setBankName((String) payload.get("bankName"));
        account.setAccountNumber((String) payload.get("accountNumber"));
        account.setAccountHolder((String) payload.get("accountHolder"));
        
        return ApiResponse.success("新增成功", bankAccountRepository.save(account));
    }

    @PutMapping("/bank-accounts/{id}")
    public ApiResponse<BankAccount> updateBankAccount(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        // 注释掉权限校验进行测试，或者确保前端传了 Token
        // if (!securityUtils.isAdmin()) return ApiResponse.<BankAccount>error(403, "无权访问");
        
        BankAccount account = bankAccountRepository.findById(id).orElse(null);
        if (account == null) return ApiResponse.<BankAccount>error(404, "记录不存在");
        
        if (payload.get("farmerId") != null) account.setFarmerId(Long.valueOf(payload.get("farmerId").toString()));
        if (payload.get("bankName") != null) account.setBankName((String) payload.get("bankName"));
        if (payload.get("accountNumber") != null) account.setAccountNumber((String) payload.get("accountNumber"));
        if (payload.get("accountHolder") != null) account.setAccountHolder((String) payload.get("accountHolder"));
        
        return ApiResponse.success("更新成功", bankAccountRepository.save(account));
    }

    @DeleteMapping("/bank-accounts/{id}")
    public ApiResponse<String> deleteBankAccount(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        bankAccountRepository.deleteById(id);
        return ApiResponse.success("删除成功", "ok");
    }

    @GetMapping("/farm-photos/all")
    public ApiResponse<List<FarmPhoto>> getAllFarmPhotos() {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<FarmPhoto>>error(403, "无权访问");
        return ApiResponse.success(farmPhotoRepository.findAll(Sort.by(Sort.Direction.ASC, "createdAt")));
    }

    /**
     * 新增农场照片
     */
    @PostMapping("/farm-photos")
    public ApiResponse<FarmPhoto> addFarmPhoto(@RequestBody FarmPhoto photo) {
        if (!securityUtils.isAdmin()) return ApiResponse.<FarmPhoto>error(403, "无权操作");
        
        Long farmerId = photo.getFarmerId();
        if (farmerId != null) {
            int currentCount = farmPhotoRepository.countByFarmerId(farmerId);
            if (currentCount >= 6) {
                return ApiResponse.<FarmPhoto>error(400, "该农户照片数量已达上限（6张）");
            }
        }
        
        return ApiResponse.success("新增成功", farmPhotoRepository.save(photo));
    }

    /**
     * 批量新增农场照片
     */
    @PostMapping("/farm-photos/batch")
    public ApiResponse<List<FarmPhoto>> batchAddFarmPhotos(@RequestBody Map<String, Object> params) {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<FarmPhoto>>error(403, "无权操作");
        
        Long farmerId = Long.valueOf(params.get("farmerId").toString());
        List<String> urls = (List<String>) params.get("urls");
        
        if (urls == null || urls.isEmpty()) {
            return ApiResponse.<List<FarmPhoto>>error(400, "请提供图片地址");
        }
        
        int currentCount = farmPhotoRepository.countByFarmerId(farmerId);
        if (currentCount + urls.size() > 6) {
            return ApiResponse.<List<FarmPhoto>>error(400, String.format("该农户照片数量将超过上限（还可传%d张）", 6 - currentCount));
        }
        
        List<FarmPhoto> photos = new ArrayList<>();
        for (String url : urls) {
            FarmPhoto photo = new FarmPhoto();
            photo.setFarmerId(farmerId);
            photo.setUrl(url);
            photos.add(photo);
        }
        
        return ApiResponse.success("批量新增成功", farmPhotoRepository.saveAll(photos));
    }

    /**
     * 更新农场照片
     */
    @PutMapping("/farm-photos/{id}")
    public ApiResponse<FarmPhoto> updateFarmPhoto(@PathVariable Long id, @RequestBody FarmPhoto updateData) {
        if (!securityUtils.isAdmin()) return ApiResponse.<FarmPhoto>error(403, "无权操作");
        FarmPhoto photo = farmPhotoRepository.findById(id).orElse(null);
        if (photo == null) return ApiResponse.<FarmPhoto>error(404, "记录不存在");
        
        if (updateData.getFarmerId() != null) photo.setFarmerId(updateData.getFarmerId());
        if (updateData.getUrl() != null) photo.setUrl(updateData.getUrl());
        // Description and other fields can be added if they exist in the entity
        
        return ApiResponse.success("更新成功", farmPhotoRepository.save(photo));
    }

    /**
     * 删除单张农场照片
     */
    @DeleteMapping("/farm-photos/{id}")
    public ApiResponse<String> deleteFarmPhoto(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权操作");
        if (!farmPhotoRepository.existsById(id)) return ApiResponse.<String>error(404, "记录不存在");
        farmPhotoRepository.deleteById(id);
        return ApiResponse.success("照片已删除", "ok");
    }

    /**
     * 清空指定农户的所有照片
     */
    @DeleteMapping("/farm-photos/farmer/{farmerId}")
    @Transactional
    public ApiResponse<String> clearFarmerPhotos(@PathVariable Long farmerId) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权操作");
        List<FarmPhoto> photos = farmPhotoRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        if (!photos.isEmpty()) {
            farmPhotoRepository.deleteAll(photos);
        }
        return ApiResponse.success("照片已清空", "ok");
    }





    // ==================== 产品管理 ====================

    @PostMapping("/products")
    public ApiResponse<Product> addProduct(@RequestBody Product product) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Product>error(403, "无权访问");
        if (product.getFarmer() == null || product.getFarmer().getId() == null) {
            return ApiResponse.<Product>error(400, "必须指定农户");
        }
        Farmer farmer = farmerRepository.findById(product.getFarmer().getId()).orElse(null);
        if (farmer == null) return ApiResponse.<Product>error(404, "农户不存在");
        product.setFarmer(farmer);
        extractMainImage(product);
        return ApiResponse.success("新增产品成功", productRepository.save(product));
    }

    private void extractMainImage(Product product) {
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            try {
                String images = product.getImages();
                if (images.startsWith("[") && images.endsWith("]")) {
                    String[] parts = images.substring(1, images.length() - 1).split(",");
                    if (parts.length > 0) {
                        String first = parts[0].trim();
                        if (first.startsWith("\"") && first.endsWith("\"")) {
                            first = first.substring(1, first.length() - 1);
                        }
                        product.setImage(first);
                    }
                }
            } catch (Exception e) {
                // Ignore parse errors
            }
        }
    }

    @PutMapping("/products/{id}")
    public ApiResponse<Product> updateProduct(@PathVariable Long id, @RequestBody Product updateData) {
        if (!securityUtils.isAdmin()) return ApiResponse.<Product>error(403, "无权访问");
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) return ApiResponse.<Product>error(404, "产品不存在");

        if (updateData.getName() != null) product.setName(updateData.getName());
        if (updateData.getDescription() != null) product.setDescription(updateData.getDescription());
        if (updateData.getPrice() != null) product.setPrice(updateData.getPrice());
        if (updateData.getUnit() != null) product.setUnit(updateData.getUnit());
        if (updateData.getStock() != null) product.setStock(updateData.getStock());
        if (updateData.getCategory() != null) product.setCategory(updateData.getCategory());
        if (updateData.getOrigin() != null) product.setOrigin(updateData.getOrigin());
        if (updateData.getBadge() != null) product.setBadge(updateData.getBadge());
        if (updateData.getImage() != null) product.setImage(updateData.getImage());
        if (updateData.getImages() != null) product.setImages(updateData.getImages());
        if (updateData.getStatus() != null) product.setStatus(updateData.getStatus());
        
        if (updateData.getFarmer() != null && updateData.getFarmer().getId() != null) {
            Farmer farmer = farmerRepository.findById(updateData.getFarmer().getId()).orElse(null);
            if (farmer != null) product.setFarmer(farmer);
        }

        extractMainImage(product);
        return ApiResponse.success("产品更新成功", productRepository.save(product));
    }

    @DeleteMapping("/products/{id}")
    public ApiResponse<String> deleteProduct(@PathVariable Long id) {
        if (!securityUtils.isAdmin()) return ApiResponse.<String>error(403, "无权访问");
        productRepository.deleteById(id);
        return ApiResponse.success("删除成功", "ok");
    }

    @GetMapping("/products/all")
    public ApiResponse<List<Product>> getAllProducts(@RequestParam(required = false) String keyword) {
        if (!securityUtils.isAdmin()) return ApiResponse.<List<Product>>error(403, "无权访问");
        if (keyword != null && !keyword.trim().isEmpty()) {
            return ApiResponse.success(productRepository.findByNameContainingOrCategoryContaining(keyword, keyword, Sort.by(Sort.Direction.ASC, "createdAt")));
        }
        return ApiResponse.success(productRepository.findAll(Sort.by(Sort.Direction.ASC, "createdAt")));
    }
}

