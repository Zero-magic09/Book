package com.village.controller;

import com.village.dto.ApiResponse;
import com.village.security.SecurityUtils;
import com.village.entity.*;
import com.village.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final FarmerRepository farmerRepository;

    /**
     * 发布评价（晒单）
     */
    @PostMapping
    public ApiResponse<Review> createReview(@RequestBody Map<String, Object> request) {
        Long userId = Long.parseLong(request.get("userId").toString());
        if (!securityUtils.isUser(userId)) {
            return ApiResponse.<Review>error(403, "无权以此用户身份评价");
        }
        Long orderId = Long.parseLong(request.get("orderId").toString());
        Long productId = Long.parseLong(request.get("productId").toString());
        Integer rating = Integer.parseInt(request.get("rating").toString());
        String content = (String) request.getOrDefault("content", "");
        String images = (String) request.getOrDefault("images", "");
        String taste = (String) request.getOrDefault("taste", "");

        // 检查是否已评价
        if (reviewRepository.existsByOrderIdAndProductId(orderId, productId)) {
            return ApiResponse.<Review>error(400, "该商品已评价");
        }

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ApiResponse.<Review>error(404, "订单不存在");
        }

        if (order.getStatus() != Order.OrderStatus.COMPLETED) {
            return ApiResponse.<Review>error(400, "请先确认收货后再评价");
        }

        Product product = productRepository.findById(productId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);

        if (product == null || user == null) {
            return ApiResponse.<Review>error(404, "产品或用户不存在");
        }

        Review review = new Review();
        review.setOrder(order);
        review.setProduct(product);
        review.setUser(user);
        review.setRating(rating);
        review.setContent(content);
        review.setImages(images);
        review.setTaste(taste);

        Review saved = reviewRepository.save(review);
        
        // 完成订单
        order.setStatus(Order.OrderStatus.COMPLETED);
        order.setReviewed(true);
        orderRepository.save(order);

        return ApiResponse.success("评价成功", saved);
    }

    /**
     * 获取产品评价列表
     */
    @GetMapping("/product/{productId}")
    public ApiResponse<List<Review>> getProductReviews(@PathVariable Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        return ApiResponse.success(reviews);
    }

    /**
     * 获取订单的评价列表
     */
    @GetMapping("/order/{orderId}")
    public ApiResponse<List<Review>> getOrderReviews(@PathVariable Long orderId) {
        List<Review> reviews = reviewRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
        return ApiResponse.success(reviews);
    }

    /**
     * 获取用户评价列表
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<List<Review>> getUserReviews(@PathVariable Long userId) {
        if (!securityUtils.isUser(userId)) {
            return ApiResponse.<List<Review>>error(403, "无权查看此用户的评价列表");
        }
        List<Review> reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ApiResponse.success(reviews);
    }

    /**
     * 获取农户收到的评价列表
     */
    @GetMapping("/farmer/{farmerId}")
    public ApiResponse<List<Review>> getFarmerReviews(@PathVariable Long farmerId) {
        if (!farmerRepository.findById(farmerId).map(f -> securityUtils.isUser(f.getUser().getId())).orElse(false)) {
            return ApiResponse.<List<Review>>error(403, "无权查看此农场的评价列表");
        }
        List<Review> reviews = reviewRepository.findByProductFarmerIdOrderByCreatedAtDesc(farmerId);
        return ApiResponse.success(reviews);
    }

    /**
     * 商家回复评价
     */
    @PostMapping("/{id}/reply")
    public ApiResponse<Review> replyReview(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ApiResponse.<Review>error(400, "回复内容不能为空");
        }
        
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null) {
            return ApiResponse.<Review>error(404, "评价不存在");
        }
        
        if (!securityUtils.isUser(review.getProduct().getFarmer().getUser().getId())) {
            return ApiResponse.<Review>error(403, "无权回复此评价");
        }
        
        review.setReply(content);
        review.setReplyTime(java.time.LocalDateTime.now());
        Review saved = reviewRepository.save(review);
        return ApiResponse.success("回复成功", saved);
    }
}
