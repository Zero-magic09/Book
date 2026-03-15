package com.village.controller;

import com.village.dto.ApiResponse;
import com.village.security.SecurityUtils;
import com.village.entity.*;
import com.village.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final SecurityUtils securityUtils;
    private final FarmerRepository farmerRepository;

    /**
     * 创建订单（从购物车结算）
     * 按农户拆分订单：不同农户的商品会生成独立的订单
     */
    @PostMapping
    @Transactional
    public ApiResponse<List<Order>> createOrder(@RequestBody Map<String, Object> request) {
        // 优先使用 Token 中的用户 ID
        Long userId = securityUtils.getCurrentUserId();
        
        if (userId == null) {
            return ApiResponse.<List<Order>>error(401, "请重新登录 [ERR_NO_AUTH_CONTEXT]");
        }
        
        String addressStr = (String) request.get("address");
        // 确保地址内容安全转义，防止 JSON 格式错误
        String safeAddress = addressStr == null ? "" : addressStr.trim().replace("\\", "\\\\").replace("\"", "\\\"");
        String addressSnapshot = "{\"address\": \"" + safeAddress + "\"}";
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) request.get("items");
        
        if (items == null || items.isEmpty()) {
            return ApiResponse.<List<Order>>error(400, "订单商品不能为空");
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.<List<Order>>error(404, "用户不存在");
        }

        // 按农户分组商品
        Map<Long, List<Map<String, Object>>> itemsByFarmer = new HashMap<>();
        for (Map<String, Object> item : items) {
            Long productId = Long.parseLong(item.get("productId").toString());
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) {
                throw new RuntimeException("产品不存在: " + productId);
            }
            Long farmerId = product.getFarmer().getId();
            itemsByFarmer.computeIfAbsent(farmerId, k -> new ArrayList<>()).add(item);
        }

        List<Order> createdOrders = new ArrayList<>();

        // 为每个农户创建独立订单
        for (Map.Entry<Long, List<Map<String, Object>>> entry : itemsByFarmer.entrySet()) {
            Order order = new Order();
            order.setUser(user);
            order.setAddressSnapshot(addressSnapshot);
            order.setStatus(Order.OrderStatus.PENDING);
            order.setTotalAmount(BigDecimal.ZERO);
            
            BigDecimal totalAmount = BigDecimal.ZERO;
            
            for (Map<String, Object> item : entry.getValue()) {
                Long productId = Long.parseLong(item.get("productId").toString());
                Integer quantity = Integer.parseInt(item.get("quantity").toString());
                
                Product product = productRepository.findById(productId).orElse(null);
                if (product == null) {
                    throw new RuntimeException("产品不存在: " + productId);
                }
                
                if (product.getStock() < quantity) {
                    throw new RuntimeException("库存不足: " + product.getName());
                }
                
                // 扣减库存
                product.setStock(product.getStock() - quantity);
                productRepository.save(product);
                
                // 创建订单明细
                OrderItem orderItem = new OrderItem();
                orderItem.setProduct(product);
                orderItem.setProductName(product.getName());
                orderItem.setProductImage(product.getImage());
                orderItem.setPrice(product.getPrice());
                orderItem.setQuantity(quantity);
                
                BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));
                orderItem.setSubtotal(subtotal);
                totalAmount = totalAmount.add(subtotal);
                
                order.addItem(orderItem);
            }
            
            order.setTotalAmount(totalAmount);
            Order savedOrder = orderRepository.save(order);
            createdOrders.add(savedOrder);
        }
        
        // 清空购物车
        cartRepository.deleteByUserId(userId);
        
        return ApiResponse.success("订单创建成功，共生成 " + createdOrders.size() + " 个订单", createdOrders);
    }

    /**
     * 获取用户订单列表
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<Page<Order>> getUserOrders(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (!securityUtils.isUser(userId)) {
            return ApiResponse.<Page<Order>>error(403, "无权访问此订单数据");
        }
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByUserId(userId, pageRequest);
        return ApiResponse.success(orders);
    }

    /**
     * 获取用户订单统计（各状态订单数量）
     */
    @GetMapping("/user/{userId}/stats")
    public ApiResponse<Map<String, Integer>> getOrderStats(@PathVariable Long userId) {
        if (!securityUtils.isUser(userId)) {
            return ApiResponse.<Map<String, Integer>>error(403, "无权访问");
        }
        Map<String, Integer> stats = new HashMap<>();
        
        stats.put("payment", orderRepository.countByUserIdAndStatus(userId, Order.OrderStatus.PENDING));
        stats.put("shipment", orderRepository.countByUserIdAndStatus(userId, Order.OrderStatus.PAID));
        stats.put("receipt", orderRepository.countByUserIdAndStatus(userId, Order.OrderStatus.SHIPPED));
        stats.put("review", orderRepository.countByUserIdAndStatusAndReviewed(userId, Order.OrderStatus.COMPLETED, false));
        
        return ApiResponse.success(stats);
    }

    /**
     * 获取订单详情
     */
    @GetMapping("/{id}")
    public ApiResponse<Order> getOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ApiResponse.<Order>error(404, "订单不存在");
        }
        return ApiResponse.success(order);
    }

    /**
     * 根据订单号查询
     */
    @GetMapping("/no/{orderNo}")
    public ApiResponse<Order> getOrderByNo(@PathVariable String orderNo) {
        Order order = orderRepository.findByOrderNo(orderNo);
        if (order == null) {
            return ApiResponse.<Order>error(404, "订单不存在");
        }
        return ApiResponse.success(order);
    }

    /**
     * 更新订单收货地址
     */
    @PostMapping("/{id}/address")
    @Transactional
    public ApiResponse<String> updateOrderAddress(@PathVariable Long id, @RequestBody Map<String, String> body) {
        // 获取当前登录用户
        Long currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ApiResponse.error(401, "用户未登录");
        }
        
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ApiResponse.error(404, "订单不存在");
        }
        
        // 验证订单归属
        if (!order.getUser().getId().equals(currentUserId)) {
            return ApiResponse.error(403, "无权操作此订单");
        }
        
        String address = body.get("address");
        if (address != null && !address.trim().isEmpty()) {
            // 手动构建 JSON 字符串兼容数据库 JSON 类型
            String safeAddress = address.trim().replace("\\", "\\\\").replace("\"", "\\\"");
            String jsonAddress = "{\"address\": \"" + safeAddress + "\"}";
            
            order.setAddressSnapshot(jsonAddress);
            orderRepository.save(order);
        }
        
        return ApiResponse.success("地址更新成功", "ok");
    }

    /**
     * 模拟支付
     */
    @PostMapping("/{id}/pay")
    @Transactional
    public ApiResponse<String> payOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ApiResponse.error(404, "订单不存在");
        
        if (order.getStatus() == Order.OrderStatus.PENDING) {
            order.setStatus(Order.OrderStatus.PAID);
            orderRepository.save(order);
        }
        
        return ApiResponse.success("支付成功", "ok");
    }

    /**
     * 农户发货
     */
    @PostMapping("/{id}/ship")
    @Transactional
    public ApiResponse<String> shipOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ApiResponse.error(404, "订单不存在");
        
        // 检查订单中是否有当前农户的商品
        boolean hasAuthority = order.getItems().stream()
                .anyMatch(item -> checkFarmerAuth(item.getProduct().getFarmer()));
        
        if (!hasAuthority) {
            return ApiResponse.error(403, "无权为此订单发货");
        }
        
        if (order.getStatus() != Order.OrderStatus.PAID) {
            return ApiResponse.error(400, "订单状态不正确");
        }
        
        order.setStatus(Order.OrderStatus.SHIPPED);
        orderRepository.save(order);
        
        return ApiResponse.success("发货成功", "ok");
    }

    /**
     * 用户确认收货
     */
    @PostMapping("/{id}/receive")
    @Transactional
    public ApiResponse<String> receiveOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ApiResponse.error(404, "订单不存在");
        
        if (order.getStatus() == Order.OrderStatus.SHIPPED) {
            order.setStatus(Order.OrderStatus.COMPLETED);
            grantPoints(order);
            orderRepository.save(order);
        }
        
        return ApiResponse.success("收货成功", "ok");
    }

    private void grantPoints(Order order) {
        User user = order.getUser();
        if (user != null) {
            user.setPoints((user.getPoints() == null ? 0 : user.getPoints()) + 20);
            userRepository.save(user);
        }
    }

    /**
     * 完成订单（评价后）
     */
    @PostMapping("/{id}/complete")
    public ApiResponse<String> completeOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ApiResponse.error(404, "订单不存在");
        
        order.setStatus(Order.OrderStatus.COMPLETED);
        
        // 增加生态积分 +20
        User user = order.getUser();
        if (user != null) {
            user.setPoints((user.getPoints() == null ? 0 : user.getPoints()) + 20);
            userRepository.save(user);
        }
        
        orderRepository.save(order);
        return ApiResponse.success("订单完成，获得20生态积分", "ok");
    }

    /**
     * 取消订单
     */
    @PostMapping("/{id}/cancel")
    @Transactional
    public ApiResponse<String> cancelOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ApiResponse.error(404, "订单不存在");
        
        if (order.getStatus() == Order.OrderStatus.PENDING) {
            // 恢复库存
            for (OrderItem item : order.getItems()) {
                Product p = item.getProduct();
                p.setStock(p.getStock() + item.getQuantity());
                productRepository.save(p);
            }
            
            order.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);
        }
        return ApiResponse.success("订单已取消", "ok");
    }

    /**
     * 农户查看相关订单
     */
    @GetMapping("/farmer/{farmerId}")
    public ApiResponse<Page<Order>> getFarmerOrders(
            @PathVariable Long farmerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (!farmerRepository.findById(farmerId).map(f -> securityUtils.isUser(f.getUser().getId())).orElse(false)) {
            return ApiResponse.<Page<Order>>error(403, "无权查看此农场的订单");
        }
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByFarmerId(farmerId, pageRequest);
        return ApiResponse.success(orders);
    }

    private boolean checkFarmerAuth(Farmer farmer) {
        return farmer != null && securityUtils.isUser(farmer.getUser().getId());
    }
}
