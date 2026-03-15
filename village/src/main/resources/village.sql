/*
 Navicat Premium Dump SQL

 Source Server         : wzb
 Source Server Type    : MySQL
 Source Server Version : 80044 (8.0.44)
 Source Host           : localhost:3306
 Source Schema         : village

 Target Server Type    : MySQL
 Target Server Version : 80044 (8.0.44)
 File Encoding         : 65001

 Date: 31/01/2026 14:37:57
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for address
-- ----------------------------
DROP TABLE IF EXISTS `address`;
CREATE TABLE `address`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `district` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `is_default` bit(1) NULL DEFAULT b'0',
  `created_at` datetime NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_address_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of address
-- ----------------------------
INSERT INTO `address` VALUES (1, 1, '张三', '13800000001', '北京市', '北京市', '朝阳区', '建国门外大街1号国贸中心A座2001', b'1', '2026-01-31 13:00:08', '2026-01-31 13:00:08');
INSERT INTO `address` VALUES (2, 1, '张三(公司)', '13800000001', '北京市', '北京市', '海淀区', '中关村大街27号中关村大厦1506', b'0', '2026-01-31 13:00:08', '2026-01-31 13:00:08');
INSERT INTO `address` VALUES (3, 2, '李四', '13800000002', '上海市', '上海市', '浦东新区', '陆家嘴环路1000号恒生银行大厦18F', b'1', '2026-01-31 13:00:08', '2026-01-31 13:00:08');
INSERT INTO `address` VALUES (4, 2, '李四(家)', '13800000002', '上海市', '上海市', '徐汇区', '淮海中路999号环贸iapm商场L3', b'0', '2026-01-31 13:00:08', '2026-01-31 13:00:08');
INSERT INTO `address` VALUES (5, 1, '能爆发出', '12462567364', '河北省', '唐山市', '市辖区', '你房间', b'0', '2026-01-31 13:07:37', '2026-01-31 13:07:37');
INSERT INTO `address` VALUES (6, 6, '黄海', '13457548568', '河北省', '石家庄市', '长安区', '本地', b'1', '2026-01-31 14:04:44', '2026-01-31 14:04:44');

-- ----------------------------
-- Table structure for bank_account
-- ----------------------------
DROP TABLE IF EXISTS `bank_account`;
CREATE TABLE `bank_account`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint NOT NULL,
  `bank_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `account_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `account_holder` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `is_default` bit(1) NULL DEFAULT b'0',
  `created_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of bank_account
-- ----------------------------
INSERT INTO `bank_account` VALUES (1, 1, '中国工商银行', '6222021001001234567', '王五', b'1', '2026-01-31 13:00:08');
INSERT INTO `bank_account` VALUES (2, 1, '中国农业银行', '6228481001007654321', '王五', b'0', '2026-01-31 13:00:08');
INSERT INTO `bank_account` VALUES (3, 2, '中国建设银行', '6217001001009876543', '赵六', b'1', '2026-01-31 13:00:08');
INSERT INTO `bank_account` VALUES (4, 2, '招商银行', '6214831001003456789', '赵六', b'0', '2026-01-31 13:00:08');
INSERT INTO `bank_account` VALUES (5, 2, '刘德海', '52636457475685', '赵六', b'0', '2026-01-31 13:15:40');
INSERT INTO `bank_account` VALUES (6, 4, '跟不上的', '3124515125', '大浪', b'0', '2026-01-31 14:09:03');

-- ----------------------------
-- Table structure for cart
-- ----------------------------
DROP TABLE IF EXISTS `cart`;
CREATE TABLE `cart`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT 1,
  `created_at` datetime NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_cart_user`(`user_id` ASC) USING BTREE,
  INDEX `fk_cart_product`(`product_id` ASC) USING BTREE,
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of cart
-- ----------------------------
INSERT INTO `cart` VALUES (3, 2, 7, 1, '2026-01-31 14:37:31', '2026-01-31 14:37:31');

-- ----------------------------
-- Table structure for coupon
-- ----------------------------
DROP TABLE IF EXISTS `coupon`;
CREATE TABLE `coupon`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` int NOT NULL,
  `value` decimal(10, 2) NOT NULL,
  `min_spend` decimal(10, 2) NULL DEFAULT NULL,
  `start_time` datetime NULL DEFAULT NULL,
  `end_time` datetime NULL DEFAULT NULL,
  `total_count` int NULL DEFAULT NULL,
  `remaining_count` int NULL DEFAULT NULL,
  `status` int NULL DEFAULT 1,
  `created_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of coupon
-- ----------------------------
INSERT INTO `coupon` VALUES (1, '新人专享10元券', 1, 10.00, 50.00, '2026-01-31 13:00:08', '2026-03-02 13:00:08', 1000, 996, 1, '2026-01-31 13:00:08');
INSERT INTO `coupon` VALUES (2, '满100减20大额券', 1, 20.00, 100.00, '2026-01-31 13:00:08', '2026-04-01 13:00:08', 500, 497, 1, '2026-01-31 13:00:08');
INSERT INTO `coupon` VALUES (3, '会员感恩5元券', 1, 5.00, 30.00, '2026-01-31 13:00:08', '2026-05-01 13:00:08', 2000, 2000, 1, '2026-01-31 13:00:08');
INSERT INTO `coupon` VALUES (4, '免运费券', 3, 10.00, 29.00, '2026-01-31 13:00:08', '2026-07-30 13:00:08', 800, 798, 1, '2026-01-31 13:00:08');
INSERT INTO `coupon` VALUES (5, '限时满200减50', 1, 50.00, 200.00, '2026-01-31 13:00:08', '2026-02-07 13:00:08', 100, 100, 1, '2026-01-31 13:00:08');

-- ----------------------------
-- Table structure for farm_photo
-- ----------------------------
DROP TABLE IF EXISTS `farm_photo`;
CREATE TABLE `farm_photo`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint NOT NULL,
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of farm_photo
-- ----------------------------
INSERT INTO `farm_photo` VALUES (7, 1, 'http://127.0.0.1:8080/uploads/d4f13b52-aec0-4cfa-b12d-74d6a0439612.webp', NULL, '2026-01-31 13:13:34');
INSERT INTO `farm_photo` VALUES (8, 1, 'http://127.0.0.1:8080/uploads/6dacf186-1004-4f74-b002-0fc94e8148e2.jpg', NULL, '2026-01-31 13:13:34');
INSERT INTO `farm_photo` VALUES (9, 1, 'http://127.0.0.1:8080/uploads/efc66586-5f42-4a97-a0cc-482ec8f0cc75.jpg', NULL, '2026-01-31 13:13:34');
INSERT INTO `farm_photo` VALUES (13, 2, '/uploads/380e7218-c205-4201-acd4-8cd1f88f706c.webp', NULL, '2026-01-31 14:35:56');
INSERT INTO `farm_photo` VALUES (14, 4, '/uploads/90526de0-07d4-4b77-8277-84ce1f1966bf.webp', NULL, '2026-01-31 14:36:14');

-- ----------------------------
-- Table structure for farmer
-- ----------------------------
DROP TABLE IF EXISTS `farmer`;
CREATE TABLE `farmer`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `farm_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `district` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `verified` bit(1) NULL DEFAULT b'0',
  `audit_status` enum('NOT_SUBMITTED','PENDING','APPROVED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `verified_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_farmer_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of farmer
-- ----------------------------
INSERT INTO `farmer` VALUES (1, 3, '陕北绿洲生态农场', '陕西省', '延安市', '洛川县', '洛川镇苹果路88号', '专注于有机苹果种植20年，通过国家绿色食品认证，产品远销全国各地。', b'1', 'APPROVED', '2026-01-31 13:00:08', '2026-01-31 13:00:08', '2026-01-31 13:00:08');
INSERT INTO `farmer` VALUES (2, 4, '五常稻香世家', '黑龙江省', '哈尔滨市', '五常市', '红旗镇稻花香大道168号', '三代传承的水稻种植世家，坚持传统种植工艺，只售当季新米。', b'1', 'APPROVED', '2026-01-31 13:00:08', '2026-01-31 13:00:08', '2026-01-31 13:00:08');
INSERT INTO `farmer` VALUES (4, 8, '冰霜', '河北省', '秦皇岛市', NULL, 'v古典风格', '就等于fj', b'1', 'APPROVED', '2026-01-31 13:59:51', '2026-01-31 13:46:44', '2026-01-31 13:59:51');

-- ----------------------------
-- Table structure for order_item
-- ----------------------------
DROP TABLE IF EXISTS `order_item`;
CREATE TABLE `order_item`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `product_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `price` decimal(10, 2) NOT NULL,
  `quantity` int NOT NULL,
  `subtotal` decimal(10, 2) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_order_item_order`(`order_id` ASC) USING BTREE,
  INDEX `fk_order_item_product`(`product_id` ASC) USING BTREE,
  CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_order_item_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of order_item
-- ----------------------------
INSERT INTO `order_item` VALUES (1, 1, 1, '洛川红富士苹果', '/uploads/0639dce5-5adc-4528-b275-073b8e14737a.webp', 11.60, 1, 11.60);
INSERT INTO `order_item` VALUES (2, 2, 2, '黄元帅苹果', '/uploads/6019e8e5-7205-4164-b8d9-80c744618ba1.jpg', 9.00, 1, 9.00);
INSERT INTO `order_item` VALUES (3, 3, 7, '冰霜西瓜', '/uploads/2c317bc1-a230-458f-acb6-b569dafb2757.webp', 8.00, 1, 8.00);

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `total_amount` decimal(10, 2) NOT NULL,
  `status` enum('PENDING','PAID','SHIPPED','COMPLETED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `reviewed` bit(1) NULL DEFAULT b'0',
  `address_snapshot` json NULL,
  `created_at` datetime NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_no`(`order_no` ASC) USING BTREE,
  INDEX `fk_orders_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (1, 'ORD17698371339311168', 6, 11.60, 'PAID', b'0', '{\"address\": \"内蒙古自治区包头市东河区 的回答或 (不是 14253612636)\"}', '2026-01-31 13:25:34', '2026-01-31 13:39:27');
INSERT INTO `orders` VALUES (2, 'ORD17698394472149390', 6, 9.00, 'COMPLETED', b'0', '{\"address\": \"河北省石家庄市长安区 本地 (黄海 13457548568)\"}', '2026-01-31 14:04:07', '2026-01-31 14:07:42');
INSERT INTO `orders` VALUES (3, 'ORD17698394472293891', 6, 8.00, 'COMPLETED', b'1', '{\"address\": \"河北省石家庄市长安区 本地 (黄海 13457548568)\"}', '2026-01-31 14:04:07', '2026-01-31 14:07:52');

-- ----------------------------
-- Table structure for product
-- ----------------------------
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `price` decimal(10, 2) NOT NULL,
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '斤',
  `stock` int NULL DEFAULT 0,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `origin` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `badge` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `images` json NULL,
  `status` enum('PENDING','APPROVED','REJECTED','OFFLINE') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_product_farmer`(`farmer_id` ASC) USING BTREE,
  CONSTRAINT `fk_product_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of product
-- ----------------------------
INSERT INTO `product` VALUES (1, 1, '洛川红富士苹果', '正宗洛川红富士，脆甜多汁，果香浓郁。经过严格筛选，个头均匀，色泽红润。', 11.60, '斤', 200, '时令水果', '陕西洛川', '有机认证,地标产品', '/uploads/0639dce5-5adc-4528-b275-073b8e14737a.webp', '[\"/uploads/0639dce5-5adc-4528-b275-073b8e14737a.webp\"]', 'APPROVED', '2026-01-31 13:00:08', '2026-01-31 13:38:55');
INSERT INTO `product` VALUES (2, 1, '黄元帅苹果', '口感绵软，酸甜适中，老人孩子都爱吃。自然成熟，不打蜡不催熟。', 9.00, '斤', 149, '时令水果', '陕西洛川', '农家自产', '/uploads/6019e8e5-7205-4164-b8d9-80c744618ba1.jpg', '[\"/uploads/6019e8e5-7205-4164-b8d9-80c744618ba1.jpg\"]', 'APPROVED', '2026-01-31 13:00:08', '2026-01-31 14:04:07');
INSERT INTO `product` VALUES (3, 1, '苹果干果脯', '精选优质苹果，传统工艺晾晒，无添加剂，健康零食首选。', 3.00, '斤', 500, '农家干货', '陕西洛川', '手工制作', '/uploads/66942c50-6539-420e-a4f1-bac7123531c9.jpg', '[\"/uploads/66942c50-6539-420e-a4f1-bac7123531c9.jpg\"]', 'REJECTED', '2026-01-31 13:00:08', '2026-01-31 13:12:00');
INSERT INTO `product` VALUES (4, 2, '五常稻花香大米', '正宗五常稻花香，颗粒饱满，煮饭香气四溢。当季新米，现磨现发。', 9.80, '斤', 100, '五谷杂粮', '黑龙江五常', '特级优选,新米上市', '/uploads/7da3641a-7819-4f3d-91dd-7690a0099081.jpg', '[\"/uploads/7da3641a-7819-4f3d-91dd-7690a0099081.jpg\"]', 'APPROVED', '2026-01-31 13:00:08', '2026-01-31 13:14:42');
INSERT INTO `product` VALUES (5, 2, '东北长粒香米', '精选长粒香，口感软糯，嚼劲十足。每一粒都经过精心筛选。', 7.00, '斤', 180, '五谷杂粮', '黑龙江五常', '家庭常备', '/uploads/5808a7d2-0d6c-40b5-b6e6-e7fea8f462d6.webp', '[\"/uploads/5808a7d2-0d6c-40b5-b6e6-e7fea8f462d6.webp\"]', 'APPROVED', '2026-01-31 13:00:08', '2026-01-31 13:14:46');
INSERT INTO `product` VALUES (6, 2, '有机黑米', '富含花青素和膳食纤维，滋补养生佳品。通过有机认证，安全放心。', 12.50, '斤', 300, '五谷杂粮', '黑龙江五常', '有机认证,健康饮食', '/uploads/852f975c-3ea4-4e83-bed4-d26983546616.webp', '[\"/uploads/852f975c-3ea4-4e83-bed4-d26983546616.webp\"]', 'APPROVED', '2026-01-31 13:00:08', '2026-01-31 13:14:49');
INSERT INTO `product` VALUES (7, 4, '冰霜西瓜', '狠角色h', 8.00, '斤', 699, '果蔬', '好地方好', '地理标志', '/uploads/2c317bc1-a230-458f-acb6-b569dafb2757.webp', '[\"/uploads/2c317bc1-a230-458f-acb6-b569dafb2757.webp\"]', 'APPROVED', '2026-01-31 14:00:46', '2026-01-31 14:04:07');

-- ----------------------------
-- Table structure for review
-- ----------------------------
DROP TABLE IF EXISTS `review`;
CREATE TABLE `review`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `order_id` bigint NOT NULL,
  `rating` int NULL DEFAULT 5,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `taste` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `reply` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `reply_time` datetime NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_review_user`(`user_id` ASC) USING BTREE,
  INDEX `fk_review_product`(`product_id` ASC) USING BTREE,
  INDEX `fk_review_order`(`order_id` ASC) USING BTREE,
  CONSTRAINT `fk_review_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_review_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of review
-- ----------------------------
INSERT INTO `review` VALUES (1, 6, 7, 3, 5, '孩子很爱吃', '', '', '谢谢喜欢', '2026-01-31 14:08:45', '2026-01-31 14:07:52');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `role` enum('CONSUMER','FARMER','ADMIN') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `id_card` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` enum('ACTIVE','DISABLED','PENDING') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `footprint_count` int NULL DEFAULT 0,
  `favorites_count` int NULL DEFAULT 0,
  `points` int NULL DEFAULT 0,
  `created_at` datetime NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `phone`(`phone` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (1, '1', '$2a$10$Ky9V4CBYhKawjuktttyLve/tsTK0.yb22Cwktt7ob8ADlvUAoYB.m', 'CONSUMER', '张三', '110101199001011234', '/uploads/consumer.jpg', 'ACTIVE', 8, 3, 100, '2026-01-31 13:00:08', '2026-01-31 13:16:47');
INSERT INTO `user` VALUES (2, '2', '$2a$10$Ky9V4CBYhKawjuktttyLve/tsTK0.yb22Cwktt7ob8ADlvUAoYB.m', 'CONSUMER', '李四', '110101199002022345', '/uploads/consumer.jpg', 'ACTIVE', 4, 1, 80, '2026-01-31 13:00:08', '2026-01-31 14:37:30');
INSERT INTO `user` VALUES (3, '3', '$2a$10$Ky9V4CBYhKawjuktttyLve/tsTK0.yb22Cwktt7ob8ADlvUAoYB.m', 'FARMER', '王五', '610101198501013456', '/uploads/farmers.jpg', 'ACTIVE', 0, 0, 0, '2026-01-31 13:00:08', '2026-01-31 13:12:59');
INSERT INTO `user` VALUES (4, '4', '$2a$10$Ky9V4CBYhKawjuktttyLve/tsTK0.yb22Cwktt7ob8ADlvUAoYB.m', 'FARMER', '赵六', '230101198602024567', '/uploads/farmers.jpg', 'ACTIVE', 0, 0, 0, '2026-01-31 13:00:08', '2026-01-31 13:00:08');
INSERT INTO `user` VALUES (6, '5', '$2a$10$Ky9V4CBYhKawjuktttyLve/tsTK0.yb22Cwktt7ob8ADlvUAoYB.m', 'CONSUMER', '大张伟', '856858', 'http://127.0.0.1:8080/uploads/0fdef8e5-ee1f-45d2-8453-a39a3fcf2202.webp', 'ACTIVE', 4, 1, 40, '2026-01-31 13:24:47', '2026-01-31 14:34:27');
INSERT INTO `user` VALUES (8, '6', '$2a$10$Ky9V4CBYhKawjuktttyLve/tsTK0.yb22Cwktt7ob8ADlvUAoYB.m', 'FARMER', '大浪', NULL, 'http://127.0.0.1:8080/uploads/99394e02-4574-4427-bb95-2b3b1bb468e4.webp', 'ACTIVE', 0, 0, 0, '2026-01-31 13:46:44', '2026-01-31 14:35:22');

-- ----------------------------
-- Table structure for user_coupon
-- ----------------------------
DROP TABLE IF EXISTS `user_coupon`;
CREATE TABLE `user_coupon`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `coupon_id` bigint NOT NULL,
  `status` int NULL DEFAULT 0,
  `get_time` datetime NULL DEFAULT NULL,
  `use_time` datetime NULL DEFAULT NULL,
  `order_id` bigint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_uc_user`(`user_id` ASC) USING BTREE,
  INDEX `fk_uc_coupon`(`coupon_id` ASC) USING BTREE,
  CONSTRAINT `fk_uc_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupon` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_uc_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user_coupon
-- ----------------------------
INSERT INTO `user_coupon` VALUES (1, 1, 1, 0, '2026-01-31 13:00:08', NULL, NULL);
INSERT INTO `user_coupon` VALUES (2, 1, 4, 0, '2026-01-31 13:00:08', NULL, NULL);
INSERT INTO `user_coupon` VALUES (3, 2, 2, 0, '2026-01-31 13:00:08', NULL, NULL);
INSERT INTO `user_coupon` VALUES (4, 2, 4, 0, '2026-01-31 13:00:08', NULL, NULL);
INSERT INTO `user_coupon` VALUES (5, 6, 2, 0, '2026-01-31 13:25:18', NULL, NULL);

-- ----------------------------
-- Table structure for user_favorite
-- ----------------------------
DROP TABLE IF EXISTS `user_favorite`;
CREATE TABLE `user_favorite`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_product`(`user_id` ASC, `product_id` ASC) USING BTREE,
  UNIQUE INDEX `UK9capjo0esvamn1wg7ksn1d2xq`(`user_id` ASC, `product_id` ASC) USING BTREE,
  INDEX `fk_fav_product`(`product_id` ASC) USING BTREE,
  CONSTRAINT `fk_fav_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user_favorite
-- ----------------------------
INSERT INTO `user_favorite` VALUES (1, 1, 1, '2026-01-31 13:16:12');
INSERT INTO `user_favorite` VALUES (2, 6, 2, '2026-01-31 14:08:07');

-- ----------------------------
-- Table structure for withdrawal
-- ----------------------------
DROP TABLE IF EXISTS `withdrawal`;
CREATE TABLE `withdrawal`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint NOT NULL,
  `amount` decimal(38, 2) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','COMPLETED') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of withdrawal
-- ----------------------------
INSERT INTO `withdrawal` VALUES (1, 4, 1.50, 'PENDING', '2026-01-31 14:09:07', '2026-01-31 14:09:07');

SET FOREIGN_KEY_CHECKS = 1;
