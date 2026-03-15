package com.village.controller;

import com.village.dto.ApiResponse;
import com.village.security.SecurityUtils;
import com.village.entity.*;
import com.village.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/farmer")
@RequiredArgsConstructor
public class FarmerController {

    private final FarmerRepository farmerRepository;
    private final ProductRepository productRepository;

    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final BankAccountRepository bankAccountRepository;
    private final FarmPhotoRepository farmPhotoRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final SecurityUtils securityUtils;

    /**
     * 获取农户个人资料
     */
    @GetMapping("/{farmerId}/profile")
    public ApiResponse<Map<String, Object>> getProfile(@PathVariable Long farmerId) {
        Farmer farmer = farmerRepository.findById(farmerId).orElse(null);
        if (farmer == null) {
            return ApiResponse.<Map<String, Object>>error(404, "农户不存在");
        }
        
        if (!securityUtils.isUser(farmer.getUser().getId())) {
            return ApiResponse.<Map<String, Object>>error(403, "无权访问此资料");
        }
        
        Map<String, Object> result = new HashMap<>();
        
        // 基本信息
        Map<String, Object> farmerInfo = new HashMap<>();
        farmerInfo.put("name", farmer.getUser() != null ? farmer.getUser().getRealName() : "农户");
        farmerInfo.put("farmName", farmer.getFarmName() != null ? farmer.getFarmName() : "优质农户");
        farmerInfo.put("province", farmer.getProvince());
        farmerInfo.put("city", farmer.getCity());
        farmerInfo.put("avatar", farmer.getUser() != null ? farmer.getUser().getAvatar() : null);
        farmerInfo.put("address", farmer.getAddress());
        farmerInfo.put("description", farmer.getDescription());
        farmerInfo.put("verified", Boolean.TRUE.equals(farmer.getVerified()));
        farmerInfo.put("auditStatus", farmer.getAuditStatus());
        result.put("farmerInfo", farmerInfo);
        
        // 统计数据
        List<Map<String, Object>> stats = new ArrayList<>();
        
        // 使用用户注册时间计算入驻天数，并确保从第1天开始算（当天即为第1天）
        long days = 0;
        if (farmer.getUser() != null && farmer.getUser().getCreatedAt() != null) {
            days = ChronoUnit.DAYS.between(farmer.getUser().getCreatedAt().toLocalDate(), LocalDateTime.now().toLocalDate()) + 1;
        } else {
            days = ChronoUnit.DAYS.between(farmer.getCreatedAt().toLocalDate(), LocalDateTime.now().toLocalDate()) + 1;
        }
        Map<String, Object> stat1 = new HashMap<>();
        stat1.put("id", 1);
        stat1.put("val", days + "");
        stat1.put("label", "入驻天数");
        stats.add(stat1);
        
        int reviewCount = reviewRepository.countByFarmerId(farmerId);
        Map<String, Object> stat2 = new HashMap<>();
        stat2.put("id", 2);
        stat2.put("val", reviewCount > 1000 ? (reviewCount / 1000.0) + "k" : reviewCount + "");
        stat2.put("label", "累计评价");
        stats.add(stat2);
        
        // 0. New requirement: Random ranking 1-100
        Random random = new Random();
        String ranking = "NO. " + (random.nextInt(100) + 1);
        
        Map<String, Object> stat3 = new HashMap<>();
        stat3.put("id", 3);
        stat3.put("val", ranking);
        stat3.put("label", "农场排名");
        stats.add(stat3);
        
        result.put("stats", stats);
        
        // 菜单项状态更新
        List<Map<String, Object>> menuItems = new ArrayList<>();
        
        Map<String, Object> menu1 = new HashMap<>();
        menu1.put("label", "基本信息");
        menu1.put("status", Boolean.TRUE.equals(farmer.getVerified()) ? "已认证" : "待认证");
        menu1.put("statusColor", Boolean.TRUE.equals(farmer.getVerified()) ? "text-gray-300" : "text-rose-500");
        menu1.put("icon", "📝");
        menu1.put("url", "/pages/farmer/info/info");
        menuItems.add(menu1);

        // 实名认证 - 需要同时有真实姓名和身份证号才算已认证
        Map<String, Object> menuAuth = new HashMap<>();
        menuAuth.put("label", "实名认证");
        User user = farmer.getUser();
        boolean isRealNameVerified = user != null 
            && user.getRealName() != null && !user.getRealName().isEmpty()
            && user.getIdCard() != null && !user.getIdCard().isEmpty();
        menuAuth.put("status", isRealNameVerified ? "已认证" : "未认证");
        menuAuth.put("statusColor", isRealNameVerified ? "text-gray-300" : "text-yellow-500");
        menuAuth.put("icon", "🆔");
        menuAuth.put("url", "/pages/auth/realname/realname");
        menuItems.add(menuAuth);
        
        // 结算账户 (查询真实数据)
        int accountCount = bankAccountRepository.countByFarmerId(farmerId);
        Map<String, Object> menu2 = new HashMap<>();
        menu2.put("label", "结算账户");
        menu2.put("status", accountCount > 0 ? accountCount + "个账户" : "未绑定");
        menu2.put("statusColor", accountCount > 0 ? "text-gray-300" : "text-rose-500");
        menu2.put("icon", "🏦");
        menu2.put("url", "/pages/farmer/account/account");
        menuItems.add(menu2);
        
        // 农场实拍 (查询真实数据)
        int photoCount = farmPhotoRepository.countByFarmerId(farmerId);
        Map<String, Object> menu3 = new HashMap<>();
        menu3.put("label", "农场实拍");
        menu3.put("status", photoCount > 0 ? photoCount + "张照片" : "无照片");
        menu3.put("statusColor", "text-gray-300");
        menu3.put("icon", "📸");
        menu3.put("url", "/pages/farmer/real-shot/real-shot");
        menuItems.add(menu3);
        
        Map<String, Object> menu4 = new HashMap<>();
        menu4.put("label", "评价管理");
        menu4.put("status", reviewCount > 0 ? "99% 好评" : "暂无评价");
        menu4.put("statusColor", "text-gray-300");
        menu4.put("icon", "⭐");
        menu4.put("url", "/pages/farmer/reviews/reviews");
        menuItems.add(menu4);
        
        result.put("menuItems", menuItems);
        
        return ApiResponse.success(result);
    }

    /**
     * 更新农户个人资料
     */
    @PutMapping("/{farmerId}/profile")
    public ApiResponse<Farmer> updateProfile(
            @PathVariable Long farmerId,
            @RequestBody Farmer updateData) {
        Farmer farmer = farmerRepository.findById(farmerId).orElse(null);
        if (farmer == null) {
            return ApiResponse.<Farmer>error(404, "农户不存在");
        }
        
        if (updateData.getFarmName() != null) farmer.setFarmName(updateData.getFarmName());
        if (updateData.getProvince() != null) farmer.setProvince(updateData.getProvince());
        if (updateData.getCity() != null) farmer.setCity(updateData.getCity());
        if (updateData.getAddress() != null) farmer.setAddress(updateData.getAddress());
        if (updateData.getDescription() != null) farmer.setDescription(updateData.getDescription());
        
        // Reset verification status on update
        farmer.setVerified(false);
        farmer.setAuditStatus(Farmer.AuditStatus.PENDING);
        
        Farmer saved = farmerRepository.save(farmer);
        return ApiResponse.success("资料更新成功", saved);
    }

    @PostMapping("/{farmerId}/reset-certification")
    public ApiResponse<String> resetCertification(@PathVariable Long farmerId) {
        Farmer farmer = farmerRepository.findById(farmerId).orElse(null);
        if (farmer == null) return ApiResponse.error(404, "农户不存在");
        
        if (!securityUtils.isUser(farmer.getUser().getId())) {
            return ApiResponse.error(403, "无权操作");
        }
        
        farmer.setVerified(false);
        farmer.setAuditStatus(Farmer.AuditStatus.PENDING);
        farmer.setVerifiedAt(null);
        farmerRepository.save(farmer);
        return ApiResponse.success("已重置认证状态，请更新信息并重新认证", "ok");
    }

    /**
     * 获取农户工作台仪表盘数据
     */
    @GetMapping("/{farmerId}/dashboard")
    public ApiResponse<Map<String, Object>> getDashboard(@PathVariable Long farmerId) {
        Farmer farmer = farmerRepository.findById(farmerId).orElse(null);
        if (farmer == null) {
            return ApiResponse.<Map<String, Object>>error(404, "农户不存在");
        }
        
        if (!securityUtils.isUser(farmer.getUser().getId())) {
            return ApiResponse.<Map<String, Object>>error(403, "无权访问工作台");
        }
        
        Map<String, Object> result = new HashMap<>();
        
        // 农户基本信息
        Map<String, Object> farmerInfo = new HashMap<>();
        farmerInfo.put("name", farmer.getFarmName() != null ? farmer.getFarmName() : "我的农场");
        farmerInfo.put("location", (farmer.getCity() != null ? farmer.getCity() : "") + " · 优质供应商");
        farmerInfo.put("verified", Boolean.TRUE.equals(farmer.getVerified()));
        farmerInfo.put("avatar", farmer.getUser() != null ? farmer.getUser().getAvatar() : null);
        result.put("farmerInfo", farmerInfo);
        
        // 统计数据
        List<Map<String, Object>> stats = new ArrayList<>();
        
        // 待发货订单数（状态为PAID的订单）
        int pendingShipCount = orderRepository.countByFarmerIdAndStatus(farmerId, Order.OrderStatus.PAID);
        Map<String, Object> stat1 = new HashMap<>();
        stat1.put("id", 1);
        stat1.put("value", pendingShipCount);
        stat1.put("label", "待发货");
        stat1.put("color", "#f59e0b");
        stats.add(stat1);
        
        // 月营收（本月所有已支付订单的总金额）
        BigDecimal monthlyRevenue = orderRepository.sumMonthlyRevenueByFarmerId(farmerId);
        Map<String, Object> stat2 = new HashMap<>();
        stat2.put("id", 2);
        stat2.put("value", monthlyRevenue != null ? monthlyRevenue.intValue() : 0);
        stat2.put("label", "月营收");
        stat2.put("color", "#10b981");
        stat2.put("prefix", "¥ ");
        stats.add(stat2);
        
        // 在售商品数
        int activeProductCount = productRepository.countByFarmer_IdAndStatus(farmerId, Product.ProductStatus.APPROVED);
        Map<String, Object> stat3 = new HashMap<>();
        stat3.put("id", 3);
        stat3.put("value", activeProductCount);
        stat3.put("label", "在售商品");
        stat3.put("color", "#3b82f6");
        stats.add(stat3);
        
        result.put("stats", stats);
        
        // 最近订单（最多5条）
        PageRequest pageRequest = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Order> recentOrders = orderRepository.findByFarmerId(farmerId, pageRequest).getContent();
        List<Map<String, Object>> orderList = new ArrayList<>();
        for (Order order : recentOrders) {
            Map<String, Object> orderMap = new HashMap<>();
            orderMap.put("id", order.getId());
            
            // 从明细中获取第一个商品信息进行展示
            if (!order.getItems().isEmpty()) {
                OrderItem firstItem = order.getItems().get(0);
                orderMap.put("product", firstItem.getProductName());
                orderMap.put("image", firstItem.getProductImage());
                orderMap.put("weight", firstItem.getQuantity() + " 份");
            } else {
                orderMap.put("product", "多种商品");
                orderMap.put("image", null);
                orderMap.put("weight", "-");
            }
            
            orderMap.put("buyer", order.getUser() != null ? order.getUser().getRealName() : "买家");
            orderMap.put("price", order.getTotalAmount().toString());
            
            // 计算时间描述
            long minutes = ChronoUnit.MINUTES.between(order.getCreatedAt(), LocalDateTime.now());
            String timeDesc;
            if (minutes < 60) {
                timeDesc = minutes + "分钟前";
            } else if (minutes < 1440) {
                timeDesc = (minutes / 60) + "小时前";
            } else {
                timeDesc = (minutes / 1440) + "天前";
            }
            orderMap.put("time", timeDesc);
            
            orderList.add(orderMap);
        }
        result.put("orders", orderList);
        
        return ApiResponse.success(result);
    }

    // ==================== 商品管理 ====================
    
    @GetMapping("/products")
    public ApiResponse<List<Product>> myProducts(@RequestParam Long farmerId) {
        if (!checkFarmerAuth(farmerId)) return ApiResponse.<List<Product>>error(403, "无权访问");
        List<Product> products = productRepository.findByFarmer_Id(farmerId);
        return ApiResponse.success(products);
    }

    private boolean checkFarmerAuth(Long farmerId) {
        return farmerRepository.findById(farmerId)
                .map(f -> securityUtils.isUser(f.getUser().getId()))
                .orElse(false);
    }

    @PostMapping("/products")
    public ApiResponse<Product> addProduct(@RequestParam Long farmerId, @RequestBody Product product) {
        Farmer farmer = farmerRepository.findById(farmerId).orElse(null);
        if (farmer == null) return ApiResponse.error(404, "农户不存在");
        
        if (!securityUtils.isUser(farmer.getUser().getId())) {
            return ApiResponse.error(403, "无权为此农户添加产品");
        }
        
        product.setFarmer(farmer);
        product.setStatus(Product.ProductStatus.PENDING);
        extractMainImage(product);
        Product saved = productRepository.save(product);
        return ApiResponse.success("产品添加成功，等待审核", saved);
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
    public ApiResponse<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        Product existing = productRepository.findById(id).orElse(null);
        if (existing == null) {
            return ApiResponse.<Product>error(404, "产品不存在");
        }
        
        existing.setName(product.getName());
        existing.setDescription(product.getDescription());
        existing.setPrice(product.getPrice());
        existing.setUnit(product.getUnit());
        existing.setStock(product.getStock());
        existing.setCategory(product.getCategory());
        existing.setOrigin(product.getOrigin());
        existing.setBadge(product.getBadge());
        existing.setImage(product.getImage());
        existing.setImages(product.getImages());
        
        extractMainImage(existing);
        
        // 修改后重新进入申请状态
        existing.setStatus(Product.ProductStatus.PENDING);
        
        Product saved = productRepository.save(existing);
        return ApiResponse.success("产品更新成功，请等待重新审核", saved);
    }



    @DeleteMapping("/products/{id}")
    public ApiResponse<String> deleteProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id).orElse(null);
        if (product != null) {
            product.setStatus(Product.ProductStatus.OFFLINE);
            productRepository.save(product);
            return ApiResponse.success("产品下架成功", "ok");
        } else {
            return ApiResponse.<String>error(404, "产品不存在");
        }
    }

    @GetMapping("/{farmerId}/balance")
    public ApiResponse<Map<String, Object>> getBalance(@PathVariable Long farmerId) {
        if (!checkFarmerAuth(farmerId)) return ApiResponse.<Map<String, Object>>error(403, "无权访问");
        
        BigDecimal totalRevenue = orderRepository.sumTotalRevenueByFarmerId(farmerId, Order.OrderStatus.COMPLETED);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;
        
        BigDecimal totalWithdrawn = withdrawalRepository.sumTotalWithdrawnByFarmerId(farmerId);
        if (totalWithdrawn == null) totalWithdrawn = BigDecimal.ZERO;
        
        BigDecimal balance = totalRevenue.subtract(totalWithdrawn);
        
        Map<String, Object> result = new HashMap<>();
        result.put("balance", balance.max(BigDecimal.ZERO)); // Ensure non-negative
        result.put("totalRevenue", totalRevenue);
        result.put("totalWithdrawn", totalWithdrawn);
        return ApiResponse.success(result);
    }
    
    @PostMapping("/{farmerId}/withdraw")
    public ApiResponse<Withdrawal> withdraw(@PathVariable Long farmerId, @RequestBody Map<String, BigDecimal> body) {
        if (!checkFarmerAuth(farmerId)) return ApiResponse.<Withdrawal>error(403, "无权访问");
        
        BigDecimal amount = body.get("amount");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ApiResponse.<Withdrawal>error(400, "提现金额必须大于0");
        }
        
        // Check balance
        BigDecimal totalRevenue = orderRepository.sumTotalRevenueByFarmerId(farmerId, Order.OrderStatus.COMPLETED);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;
        BigDecimal totalWithdrawn = withdrawalRepository.sumTotalWithdrawnByFarmerId(farmerId);
        if (totalWithdrawn == null) totalWithdrawn = BigDecimal.ZERO;
        BigDecimal balance = totalRevenue.subtract(totalWithdrawn);
        
        if (balance.compareTo(amount) < 0) {
            return ApiResponse.<Withdrawal>error(400, "余额不足");
        }
        
        Withdrawal withdrawal = new Withdrawal();
        withdrawal.setFarmerId(farmerId);
        withdrawal.setAmount(amount);
        // Default status is PENDING via entity
        
        Withdrawal saved = withdrawalRepository.save(withdrawal);
        return ApiResponse.success("提现申请已提交", saved);
    }

    // ==================== 结算账户管理 ====================
    
    @GetMapping("/{farmerId}/accounts")
    public ApiResponse<List<BankAccount>> getAccounts(@PathVariable Long farmerId) {
        if (!checkFarmerAuth(farmerId)) return ApiResponse.<List<BankAccount>>error(403, "无权访问");
        return ApiResponse.success(bankAccountRepository.findByFarmerId(farmerId));
    }

    @PostMapping("/{farmerId}/accounts")
    public ApiResponse<BankAccount> addAccount(@PathVariable Long farmerId, @RequestBody BankAccount account) {
        if (!checkFarmerAuth(farmerId)) return ApiResponse.<BankAccount>error(403, "无权访问");
        account.setFarmerId(farmerId);
        return ApiResponse.success(bankAccountRepository.save(account));
    }
    
    @DeleteMapping("/{farmerId}/accounts/{accountId}")
    public ApiResponse<String> deleteAccount(@PathVariable Long farmerId, @PathVariable Long accountId) {
        if (!checkFarmerAuth(farmerId)) return ApiResponse.<String>error(403, "无权访问");
        bankAccountRepository.deleteById(accountId);
        return ApiResponse.success("删除成功", "ok");
    }

    // ==================== 农场实拍管理 ====================
    
    @GetMapping("/{farmerId}/photos")
    public ApiResponse<List<FarmPhoto>> getPhotos(@PathVariable Long farmerId) {
        if (!checkFarmerAuth(farmerId)) return ApiResponse.<List<FarmPhoto>>error(403, "无权访问");
        return ApiResponse.success(farmPhotoRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId));
    }

    @PostMapping("/{farmerId}/photos")
    public ApiResponse<FarmPhoto> addPhoto(@PathVariable Long farmerId, @RequestBody FarmPhoto photo) {
        if (!checkFarmerAuth(farmerId)) return ApiResponse.<FarmPhoto>error(403, "无权访问");
        photo.setFarmerId(farmerId);
        return ApiResponse.success(farmPhotoRepository.save(photo));
    }
    
    @DeleteMapping("/{farmerId}/photos/{photoId}")
    public ApiResponse<String> deletePhoto(@PathVariable Long farmerId, @PathVariable Long photoId) {
        if (!checkFarmerAuth(farmerId)) return ApiResponse.<String>error(403, "无权访问");
        farmPhotoRepository.deleteById(photoId);
        return ApiResponse.success("删除成功", "ok");
    }

    @PostMapping("/{farmerId}/photos/batch")
    @Transactional
    public ApiResponse<List<FarmPhoto>> batchSavePhotos(@PathVariable Long farmerId, @RequestBody List<String> imageUrls) {
        if (!checkFarmerAuth(farmerId)) return ApiResponse.<List<FarmPhoto>>error(403, "无权访问");
        
        if (imageUrls.size() > 6) {
            return ApiResponse.<List<FarmPhoto>>error(400, "最多只能上传6张照片");
        }

        // 删除旧照片
        List<FarmPhoto> oldPhotos = farmPhotoRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        farmPhotoRepository.deleteAll(oldPhotos);

        // 保存新照片
        List<FarmPhoto> newPhotos = new ArrayList<>();
        for (String url : imageUrls) {
            FarmPhoto photo = new FarmPhoto();
            photo.setFarmerId(farmerId);
            photo.setUrl(url);
            newPhotos.add(photo);
        }
        
        List<FarmPhoto> saved = farmPhotoRepository.saveAll(newPhotos);
        return ApiResponse.success("保存成功", saved);
    }
}
