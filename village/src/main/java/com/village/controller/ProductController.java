package com.village.controller;

import com.village.dto.ApiResponse;
import com.village.entity.Farmer;
import com.village.entity.Product;
import com.village.repository.ProductRepository;
import com.village.repository.ReviewRepository;
import com.village.repository.FarmerRepository;
import com.village.repository.OrderRepository;
import com.village.repository.UserFavoriteRepository;
import com.village.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final FarmerRepository farmerRepository;
    private final UserFavoriteRepository userFavoriteRepository;
    private final OrderRepository orderRepository;
    private final SecurityUtils securityUtils;

    /**
     * 创建产品
     */
    @PostMapping
    public ApiResponse<Product> createProduct(@RequestBody Product product, @RequestParam Long farmerId) {
        Farmer farmer = farmerRepository.findById(farmerId).orElse(null);
        if (farmer == null) {
            return ApiResponse.<Product>error(404, "农户不存在");
        }
        
        if (!securityUtils.isUser(farmer.getUser().getId())) {
            return ApiResponse.<Product>error(403, "无权以此农户身份创建产品");
        }
        
        product.setFarmer(farmer);
        product.setStatus(Product.ProductStatus.PENDING); // 默认为待审核
        product.setCreatedAt(java.time.LocalDateTime.now());
        product.setUpdatedAt(java.time.LocalDateTime.now());
        if (product.getImage() == null) product.setImage("https://picsum.photos/seed/" + UUID.randomUUID() + "/300/300");
        return ApiResponse.success(productRepository.save(product));
    }

    /**
     * 更新产品
     */
    @PutMapping("/{id}")
    public ApiResponse<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return ApiResponse.<Product>error(404, "产品不存在");
        }
        
        if (!securityUtils.isUser(product.getFarmer().getUser().getId())) {
            return ApiResponse.<Product>error(403, "无权修改此产品");
        }
        
        if (productDetails.getName() != null) product.setName(productDetails.getName());
        if (productDetails.getPrice() != null) product.setPrice(productDetails.getPrice());
        if (productDetails.getDescription() != null) product.setDescription(productDetails.getDescription());
        if (productDetails.getStock() != null) product.setStock(productDetails.getStock());
        if (productDetails.getUnit() != null) product.setUnit(productDetails.getUnit());
        if (productDetails.getOrigin() != null) product.setOrigin(productDetails.getOrigin());
        if (productDetails.getImage() != null) product.setImage(productDetails.getImage());
        if (productDetails.getCategory() != null) product.setCategory(productDetails.getCategory());
        if (productDetails.getBadge() != null) product.setBadge(productDetails.getBadge());
        
        product.setUpdatedAt(java.time.LocalDateTime.now());
        return ApiResponse.success(productRepository.save(product));
    }

    /**
     * 删除产品
     */
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) {
             return ApiResponse.<String>error(404, "产品不存在");
        }
        
        if (!securityUtils.isUser(product.getFarmer().getUser().getId())) {
            return ApiResponse.<String>error(403, "无权删除此产品");
        }
        
        productRepository.deleteById(id);
        return ApiResponse.success("产品已删除", "ok");
    }

    /**
     * 产品列表（支持多维度筛选）
     * @param category 分类: 果蔬、粮油、畜禽、干货
     * @param badge 标签: 当季鲜采、现摘现发、有机认证、地理标志
     * @param origin 产地筛选
     */
    @GetMapping
    public ApiResponse<Page<Map<String, Object>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String badge,
            @RequestParam(required = false) String origin) {
        
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Product> allProducts = productRepository.findByStatus(Product.ProductStatus.APPROVED, pageRequest);
        
        Long currentUserId = securityUtils.getCurrentUserId();
        Set<Long> favoriteProductIds = new HashSet<>();
        
        // Filter and map
        List<Map<String, Object>> filteredContent = allProducts.getContent().stream()
            .filter(p -> category == null || category.isEmpty() || (p.getCategory() != null && p.getCategory().contains(category)))
            .filter(p -> badge == null || badge.isEmpty() || (p.getBadge() != null && p.getBadge().contains(badge)))
            .filter(p -> origin == null || origin.isEmpty() || (p.getOrigin() != null && p.getOrigin().contains(origin)))
            .map(p -> {
                if (currentUserId != null && userFavoriteRepository.findByUserIdAndProductId(currentUserId, p.getId()).isPresent()) {
                    favoriteProductIds.add(p.getId());
                }
                
                Map<String, Object> map = new HashMap<>();
                map.put("id", p.getId());
                map.put("name", p.getName());
                map.put("price", p.getPrice());
                map.put("unit", p.getUnit());
                map.put("origin", p.getOrigin());
                map.put("image", p.getImage());
                map.put("category", p.getCategory());
                map.put("badge", p.getBadge());
                map.put("stock", p.getStock());
                map.put("farmer", p.getFarmer());
                map.put("isFavorited", favoriteProductIds.contains(p.getId()));
                return map;
            })
            .collect(java.util.stream.Collectors.toList());

        // Since we are filtering in memory after pagination, total count remains from Page
        // This is a common simplification in this project as noted in original code
        org.springframework.data.domain.PageImpl<Map<String, Object>> resultPage = 
            new org.springframework.data.domain.PageImpl<>(filteredContent, pageRequest, allProducts.getTotalElements());
        
        return ApiResponse.success(resultPage);
    }

    /**
     * 获取分类列表
     */
    @GetMapping("/categories")
    public ApiResponse<List<Map<String, String>>> getCategories() {
        List<Map<String, String>> categories = Arrays.asList(
            Map.of("id", "1", "name", "果蔬", "icon", "🍎"),
            Map.of("id", "2", "name", "粮油", "icon", "🌾"),
            Map.of("id", "3", "name", "畜禽", "icon", "🐔"),
            Map.of("id", "4", "name", "干货", "icon", "🥜")
        );
        return ApiResponse.success(categories);
    }

    /**
     * 获取特色标签
     */
    @GetMapping("/badges")
    public ApiResponse<List<Map<String, String>>> getBadges() {
        List<Map<String, String>> badges = Arrays.asList(
            Map.of("id", "1", "name", "当季鲜采", "color", "#52c41a"),
            Map.of("id", "2", "name", "现摘现发", "color", "#faad14"),
            Map.of("id", "3", "name", "有机认证", "color", "#1890ff"),
            Map.of("id", "4", "name", "地理标志", "color", "#722ed1"),
            Map.of("id", "5", "name", "产地直供", "color", "#eb2f96")
        );
        return ApiResponse.success(badges);
    }

    /**
     * 产品详情（包含农户信息、评价统计）
     */
    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable Long id) {
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return ApiResponse.<Map<String, Object>>error(404, "产品不存在");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("product", product);
        
        // 农户信息
        if (product.getFarmer() != null) {
            Map<String, Object> farmer = new HashMap<>();
            farmer.put("id", product.getFarmer().getId());
            farmer.put("farmName", product.getFarmer().getFarmName());
            farmer.put("province", product.getFarmer().getProvince());
            farmer.put("city", product.getFarmer().getCity());
            farmer.put("description", product.getFarmer().getDescription());
            result.put("farmer", farmer);
        }
        
        // 评价统计
        var reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(id);
        result.put("reviewCount", reviews.size());
        if (!reviews.isEmpty()) {
            double avgRating = reviews.stream()
                .mapToInt(r -> r.getRating())
                .average()
                .orElse(0);
            result.put("avgRating", Math.round(avgRating * 10) / 10.0);
        } else {
            result.put("avgRating", 0);
        }
        
        // 收藏状态
        Long currentUserId = securityUtils.getCurrentUserId();
        boolean isFavorited = false;
        if (currentUserId != null) {
            isFavorited = userFavoriteRepository.findByUserIdAndProductId(currentUserId, id).isPresent();
        }
        result.put("isFavorited", isFavorited);
        
        // 累计销量
        result.put("sales", orderRepository.sumSalesByProductId(id));
        
        return ApiResponse.success(result);
    }
}
