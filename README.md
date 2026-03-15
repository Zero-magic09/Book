# 乡味直连 --- 乡村农产品直销平台

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Java](https://img.shields.io/badge/Java-21-orange)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)

**乡味直连** 是一个连接乡村农户与城市消费者的全栈农产品直销平台。本项目旨在缩短农产品流通链路，实现“源头直供”，助力乡村振兴，提高农户收入。

## 🌟 核心特性
- **三端协同**：包含消费者端小程序（购买、评价）、农户端小程序（上架、订单处理、收益管理）及 PC 管理后台（审核、认证、数据统计）。
- **完整交易流**：涵盖 浏览 -> 购物车 -> 下单 -> 支付(模拟) -> 发货 -> 收货 -> 评价 的完整闭环。
- **农户赋能**：农户可自主管理产品信息、查看农场实拍实景、进行收益统计及提现申请。
- **平台管控**：严谨的产品审核流程和农户资质认证体系，确保平台产品质量。
- **多维度筛选**：支持按产地、分类、特色标签（如有机认证、当季鲜采）进行精准筛选。

## 🛠️ 技术栈
- **后端**：Java 21, Spring Boot 3.2, Spring Data JPA, Spring Security, JWT, Maven
- **前端**：微信小程序原生框架, React 18, Ant Design 5, Vite, Axios
- **数据库**：MySQL 8.0

## 📂 项目结构
- `village/`: 后端核心工程模块。
  - `admin-frontend/`: 基于 React 的 PC 端管理后台源码。
- `miniprogram/`: 微信小程序移动端源码（集成消费者与农户功能）。
- `village/src/main/resources/village.sql`: 完整的数据库初始化脚本。

## 🚀 快速启动
1. **数据库准备**：在 MySQL 中创建数据库 `village`，并运行 `village/src/main/resources/village.sql` 脚本。
2. **后端启动**：修改 `village/src/main/resources/application.yml` 中的数据库账号密码，运行 `VillageApplication.java`。
3. **管理后台**：进入 `village/admin-frontend` 目录，执行 `npm install` 后 `npm run dev`（管理账号：admin / 密码：admin）。
4. **小程序启动**：使用微信开发者工具打开 `miniprogram` 文件夹，修改 `utils/request.js` 中的 API 地址为本地后端地址即可预览。

---
*本项目由 Zero-magic09 开发并维护。*
