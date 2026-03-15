const { get, post, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        id: '',
        activeSection: 'info',
        product: null,
        traceInfo: null,
        logs: [],
        farmer: null,
        userId: null
    },

    onLoad(options) {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.setData({ userId: userInfo.userId });
            this.trackFootprint(userInfo.userId); // 记录足迹
        }
        const id = options.id || '1';
        const section = options.section || 'info';
        this.setData({ id, activeSection: section });
        this.fetchProductDetail(id);
        this.fetchProductDetail(id);
    },

    async trackFootprint(userId) {
        if (this.hasTrackedFootprint) return;
        this.hasTrackedFootprint = true;

        try {
            await post(`/users/${userId}/footprint`, {});
        } catch (err) {
            console.error('Track footprint failed', err);
        }
    },

    async fetchProductDetail(id) {
        try {
            const res = await get(`/products/${id}`);
            if (res.code === 200 && res.data) {
                // 后端返回嵌套结构: { product, farmer, traces, reviewCount, avgRating }
                const data = res.data;
                const product = data.product || data;
                product.image = formatImageURL(product.image);

                // 处理轮播图逻辑
                try {
                    if (product.images && typeof product.images === 'string') {
                        let parsedImages = JSON.parse(product.images);
                        // 如果解析出来是数组且不为空，则处理每个URL
                        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                            product.swiperImages = parsedImages.map(img => formatImageURL(img));
                        } else {
                            // 空数组则回退到主图
                            product.swiperImages = [product.image];
                        }
                    } else if (Array.isArray(product.images) && product.images.length > 0) {
                        // 如果已经是数组（虽然DB是JSON字符串，防御性编程）
                        product.swiperImages = product.images.map(img => formatImageURL(img));
                    } else {
                        // 没有images字段或格式不对，回退到主图
                        product.swiperImages = [product.image];
                    }
                } catch (e) {
                    console.error('Parse images failed', e);
                    product.swiperImages = [product.image];
                }
                const farmer = data.farmer;

                this.setData({
                    product,
                    farmer: farmer ? {
                        name: `农户: ${farmer.farmName || '未知'}`,
                        desc: farmer.province ? `${farmer.province}${farmer.city || ''}` : '专业种植户',
                        quote: farmer.description || '用心种植，品质保证',
                        avatar: 'https://picsum.photos/seed/farmer/100/100',
                        images: [
                            'https://picsum.photos/seed/farm1/300/300',
                            'https://picsum.photos/seed/farm2/300/300',
                            'https://picsum.photos/seed/farm3/300/300'
                        ]
                    } : null
                });

                // 总是生成随机演示日志，不再使用后端溯源数据
                const logs = this.generateRandomLogs();

                this.setData({
                    traceInfo: {
                        batchNo: this.generateBatchNo(),
                        origin: product.origin,
                        growthCycle: '120天'
                    },
                    logs: logs
                });
            }
        } catch (err) {
            console.error('Fetch product detail failed', err);
        }
    },

    generateRandomLogs() {
        const actions = [
            { type: '播种', content: '选用优质种子，进行土壤翻耕和底肥施用。' },
            { type: '灌溉', content: '引入山泉水进行灌溉，保证土壤湿度适宜。' },
            { type: '除草', content: '人工除草，不使用除草剂，保护生态环境。' },
            { type: '施肥', content: '施用农家有机肥，补充作物生长所需营养。' },
            { type: '质检', content: '农技员进行病虫害监测，作物生长状况良好。' },
            { type: '采摘', content: '果实成熟，人工精心采摘，筛选优质果实。' }
        ];

        const count = Math.floor(Math.random() * 3) + 3; // 随机生成 3-5 条记录
        const logs = [];
        const updateTime = new Date();

        for (let i = 0; i < count; i++) {
            // 每条记录时间倒推 5-10 天
            updateTime.setDate(updateTime.getDate() - Math.floor(Math.random() * 5) - 5);
            const action = actions[Math.floor(Math.random() * actions.length)];

            logs.push({
                date: this.formatDate(updateTime),
                type: action.type,
                content: action.content
            });
        }

        return logs;
    },

    generateBatchNo() {
        const date = new Date();
        const yyyyMMdd = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `BATCH-${yyyyMMdd}-${randomSuffix}`;
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    },

    handleBack() {
        wx.navigateBack();
    },

    handleTabSelect(e) {
        this.setData({ activeSection: e.currentTarget.dataset.id });
    },

    handleHome() {
        wx.reLaunch({ url: '/pages/user/marketplace/marketplace' });
    },

    async handleCart() {
        if (!this.data.product) {
            wx.showToast({ title: '商品信息加载中', icon: 'none' });
            return;
        }
        try {
            const res = await post('/cart', {
                userId: this.data.userId,
                productId: this.data.product.id,
                quantity: 1
            });
            if (res.code === 200) {
                wx.showToast({ title: '已加入购物车', icon: 'success' });
            } else {
                wx.showToast({ title: res.message || '添加失败', icon: 'none' });
            }
        } catch (err) {
            wx.showToast({ title: '网络错误', icon: 'none' });
        }
    },

    async toggleFavorite() {
        if (!this.data.product || !this.data.userId) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        const isFavorited = this.data.product.isFavorited || false;
        const newStatus = !isFavorited;

        // 乐观更新
        this.setData({
            'product.isFavorited': newStatus
        });

        try {
            const res = await post(`/users/${this.data.userId}/favorites`, {
                productId: this.data.product.id,
                increment: newStatus
            });
            if (res.code !== 200) {
                // 失败回滚
                this.setData({
                    'product.isFavorited': isFavorited
                });
                wx.showToast({ title: res.message || '操作失败', icon: 'none' });
            }
        } catch (err) {
            this.setData({
                'product.isFavorited': isFavorited
            });
            wx.showToast({ title: '操作失败', icon: 'none' });
        }
    },

    async handleBuy() {
        if (!this.data.product) {
            wx.showToast({ title: '商品信息加载中', icon: 'none' });
            return;
        }

        const token = wx.getStorageSync('token');
        if (!token) {
            wx.showModal({
                title: '提示',
                content: '您尚未登录，请先登录',
                success(res) {
                    if (res.confirm) {
                        wx.navigateTo({ url: '/pages/auth/login-consumer/login-consumer' });
                    }
                }
            });
            return;
        }

        wx.showLoading({ title: '正在处理...' });

        try {
            // 获取地址信息 (参考 cart.js 的默认处理，或尝试获取真实默认地址)
            let addressStr = "默认地址：北京市朝阳区";
            try {
                const addrRes = await get(`/users/${this.data.userId}/addresses`);
                if (addrRes.code === 200 && addrRes.data.length > 0) {
                    const def = addrRes.data.find(a => a.isDefault) || addrRes.data[0];
                    addressStr = `${def.province}${def.city}${def.district} ${def.address} (${def.name} ${def.phone})`;
                }
            } catch (e) {
                console.error('Fetch address failed', e);
            }

            const orderData = {
                userId: this.data.userId,
                address: addressStr,
                items: [{
                    productId: this.data.product.id,
                    quantity: 1
                }]
            };

            const res = await post('/orders', orderData);
            wx.hideLoading();

            if (res.code === 200) {
                // 后端返回订单数组 List<Order>
                const orders = res.data;
                if (Array.isArray(orders) && orders.length > 0) {
                    const orderIds = orders.map(o => o.id).join(',');
                    wx.showToast({ title: '已提交订单', icon: 'success' });
                    setTimeout(() => {
                        wx.navigateTo({
                            url: `/pages/user/payment/payment?orderIds=${orderIds}`
                        });
                    }, 800);
                } else {
                    // 兼容单订单对象
                    wx.showToast({ title: '已提交订单', icon: 'success' });
                    setTimeout(() => {
                        wx.navigateTo({
                            url: `/pages/user/payment/payment?orderId=${orders.id || orders}`
                        });
                    }, 800);
                }
            } else {
                wx.showModal({
                    title: '下单失败',
                    content: res.message || '未知错误',
                    showCancel: false
                });
            }
        } catch (err) {
            wx.hideLoading();
            console.error(err);
            wx.showToast({ title: '下单失败', icon: 'none' });
        }
    }
})

