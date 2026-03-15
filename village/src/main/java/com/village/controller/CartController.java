package com.village.controller;

import com.village.dto.ApiResponse;
import com.village.security.SecurityUtils;
import com.village.entity.Cart;
import com.village.entity.Product;
import com.village.entity.User;
import com.village.repository.CartRepository;
import com.village.repository.ProductRepository;
import com.village.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    /**
     * 获取购物车
     */
    @GetMapping("/{userId}")
    public ApiResponse<List<Cart>> getCart(@PathVariable Long userId) {
        if (!securityUtils.isUser(userId)) {
            return ApiResponse.<List<Cart>>error(403, "无权访问购物车");
        }
        List<Cart> items = cartRepository.findByUserId(userId);
        return ApiResponse.success(items);
    }

    /**
     * 添加商品到购物车
     */
    @PostMapping
    public ApiResponse<Cart> addToCart(@RequestBody Map<String, Object> request) {
        Long userId = Long.parseLong(request.get("userId").toString());
        if (!securityUtils.isUser(userId)) {
            return ApiResponse.<Cart>error(403, "无权操作");
        }
        Long productId = Long.parseLong(request.get("productId").toString());
        Integer quantity = Integer.parseInt(request.getOrDefault("quantity", 1).toString());

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.<Cart>error(404, "用户不存在");
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return ApiResponse.<Cart>error(404, "产品不存在");
        }

        // 检查是否已在购物车
        Cart cart = cartRepository.findByUserIdAndProductId(userId, productId)
            .orElse(null);

        if (cart != null) {
            cart.setQuantity(cart.getQuantity() + quantity);
        } else {
            cart = new Cart();
            cart.setUser(user);
            cart.setProduct(product);
            cart.setQuantity(quantity);
        }

        Cart saved = cartRepository.save(cart);
        return ApiResponse.success("添加成功", saved);
    }

    /**
     * 更新购物车数量
     */
    @PutMapping("/{id}")
    public ApiResponse<Cart> updateCartItem(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Integer quantity = Integer.parseInt(request.get("quantity").toString());

        Cart cart = cartRepository.findById(id).orElse(null);
        if (cart == null) {
            return ApiResponse.<Cart>error(404, "购物车商品不存在");
        }
        
        if (quantity <= 0) {
            cartRepository.delete(cart);
            return ApiResponse.<Cart>success("已移除", null);
        }
        cart.setQuantity(quantity);
        Cart saved = cartRepository.save(cart);
        return ApiResponse.success("更新成功", saved);
    }

    /**
     * 删除购物车商品
     */
    @DeleteMapping("/{id}")
    public ApiResponse<String> removeFromCart(@PathVariable Long id) {
        if (cartRepository.existsById(id)) {
            cartRepository.deleteById(id);
            return ApiResponse.success("已移除", "ok");
        }
        return ApiResponse.<String>error(404, "购物车商品不存在");
    }

    /**
     * 清空购物车
     */
    @DeleteMapping("/user/{userId}")
    public ApiResponse<String> clearCart(@PathVariable Long userId) {
        cartRepository.deleteByUserId(userId);
        return ApiResponse.success("购物车已清空", "ok");
    }
}
