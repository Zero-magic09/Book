const { get, put, del, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        activeTab: 'cart',
        tabItems: [
            { id: 'market', label: '集市', icon: '🏪' },
            { id: 'cart', label: '购物车', icon: '🛒' },
            { id: 'trace', label: '溯源', icon: '🔍' },
            { id: 'profile', label: '我的', icon: '👤' }
        ],
        cartItems: [],
        totalPrice: '0.00',
        userId: null
    },

    onLoad() {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.setData({ userId: userInfo.userId });
        }
        this.fetchCart();
    },

    onShow() {
        wx.hideHomeButton();
        this.fetchCart();
    },

    async fetchCart() {
        try {
            const res = await get(`/cart/${this.data.userId}`);
            if (res.code === 200) {
                const items = res.data.map(item => ({
                    id: item.id,
                    name: item.product.name,
                    price: item.product.price,
                    farmer: item.product.farmer ? item.product.farmer.farmName : '自营',
                    quantity: item.quantity,
                    image: formatImageURL(item.product.image),
                    selected: true, // Default selected
                    productId: item.product.id
                }));
                this.setData({ cartItems: items });
                this.calculateTotal();
            }
        } catch (err) {
            console.error('Fetch cart failed', err);
        }
    },

    handleTabSelect(e) {
        const tabId = e.detail.id || e.detail;
        if (tabId === 'cart') return;

        const urls = {
            market: '/pages/user/marketplace/marketplace',
            trace: '/pages/user/traceability/traceability',
            profile: '/pages/user/profile/profile'
        };

        if (urls[tabId]) wx.reLaunch({ url: urls[tabId] });
    },

    async increaseQty(e) {
        const id = e.currentTarget.dataset.id;
        const item = this.data.cartItems.find(i => i.id === id);
        if (!item) return;

        const newQty = item.quantity + 1;
        await this.updateCartItem(id, newQty);
    },

    async decreaseQty(e) {
        const id = e.currentTarget.dataset.id;
        const item = this.data.cartItems.find(i => i.id === id);
        if (!item) return;

        const newQty = item.quantity - 1;
        if (newQty <= 0) {
            // Delete
            wx.showModal({
                title: '提示',
                content: '确定要删除该商品吗？',
                success: async (res) => {
                    if (res.confirm) {
                        try {
                            const res = await del(`/cart/${id}`);
                            if (res.code === 200) {
                                this.fetchCart();
                            }
                        } catch (err) {
                            console.error('Delete item failed', err);
                        }
                    }
                }
            });
        } else {
            await this.updateCartItem(id, newQty);
        }
    },

    async updateCartItem(id, quantity) {
        try {
            const res = await put(`/cart/${id}`, { quantity });
            if (res.code === 200) {
                // Optimistic update or refetch
                this.fetchCart();
            }
        } catch (err) {
            console.error('Update cart failed', err);
        }
    },

    calculateTotal() {
        let total = 0;
        this.data.cartItems.forEach(item => {
            if (item.selected) {
                total += parseFloat(item.price) * item.quantity;
            }
        });
        this.setData({ totalPrice: total.toFixed(2) });
    },

    async checkout() {
        // 检查登录状态
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

        // 创建订单逻辑 (API: POST /api/orders)
        if (this.data.cartItems.length === 0) return;

        wx.showLoading({ title: '正在下单...' });

        try {
            // 获取地址信息 (获取真实默认地址)
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

            // 构造订单请求数据
            const orderItems = this.data.cartItems
                .filter(item => item.selected)
                .map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }));

            const orderData = {
                userId: this.data.userId,
                address: addressStr,
                items: orderItems
            };

            const { post } = require('../../../utils/request.js');
            const res = await post('/orders', orderData);

            wx.hideLoading();
            if (res.code === 200) {
                // 后端现在返回订单数组 List<Order>
                const orders = res.data;
                if (Array.isArray(orders) && orders.length > 0) {
                    // 提取所有订单 ID
                    const orderIds = orders.map(o => o.id).join(',');
                    wx.showToast({ title: `已生成${orders.length}个订单`, icon: 'success' });
                    setTimeout(() => {
                        wx.navigateTo({
                            url: `/pages/user/payment/payment?orderIds=${orderIds}`
                        });
                    }, 1000);
                } else {
                    // 兼容单订单响应（如果有的话）
                    wx.showToast({ title: '已提交订单', icon: 'success' });
                    setTimeout(() => {
                        wx.navigateTo({
                            url: `/pages/user/payment/payment?orderId=${orders.id || orders}`
                        });
                    }, 1000);
                }
            } else {
                // 增加详细提示
                wx.showModal({
                    title: '下单失败',
                    content: res.message || '未知错误',
                    showCancel: false
                });
            }
        } catch (err) {
            wx.hideLoading();
            console.error(err);
            // 处理 403 用于提示
            if (err.statusCode === 403) {
                wx.showModal({
                    title: '权限验证失败',
                    content: '登录已过期或无权操作，请重新登录',
                    success(res) {
                        if (res.confirm) {
                            wx.removeStorageSync('token');
                            wx.navigateTo({ url: '/pages/auth/login-consumer/login-consumer' });
                        }
                    }
                });
            } else {
                wx.showToast({ title: '网络错误: ' + (err.statusCode || ''), icon: 'none' });
            }
        }
    }
})
