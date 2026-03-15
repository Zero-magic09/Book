const { get, post, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        activeTab: 0,
        tabs: [
            { id: 0, name: '全部', type: 'all', status: null },
            { id: 1, name: '待支付', type: 'payment', status: 'PENDING' },
            { id: 2, name: '待发货', type: 'shipment', status: 'PAID' },
            { id: 3, name: '待收货', type: 'receipt', status: 'SHIPPED' },
            { id: 4, name: '评价', type: 'review', status: 'DELIVERED' }
        ],
        orders: [],
        filteredOrders: [],
        userId: null,
        reviewFilter: 'pending', // 'pending' | 'completed'
        showReviewModal: false,
        currentReviews: [],
        currentOrderNo: ''
    },

    onLoad(options) {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.setData({ userId: userInfo.userId });
        }
        const type = options.type || 'all';
        const tabIndex = this.data.tabs.findIndex(t => t.type === type);
        this.setData({
            activeTab: tabIndex >= 0 ? tabIndex : 0
        });
        this.fetchOrders();
    },

    onShow() {
        this.fetchOrders();
    },

    async fetchOrders() {
        try {
            const res = await get(`/orders/user/${this.data.userId}`);
            if (res.code === 200) {
                const apiOrders = res.data.content || res.data || [];

                // 新结构：每个订单已经是独立的，items 是商品明细数组
                const orders = apiOrders.map(order => {
                    const items = order.items || [];
                    return {
                        id: order.orderNo,
                        orderId: order.id,
                        status: (order.status === 'COMPLETED' && !order.reviewed) ? 'review' : this.mapStatus(order.status),
                        statusText: (order.status === 'COMPLETED' && !order.reviewed) ? '待评价' : this.formatStatus(order.status),
                        products: items.map(item => ({
                            name: item.productName,
                            image: formatImageURL(item.productImage),
                            price: item.price,
                            count: item.quantity,
                            productId: item.product ? item.product.id : item.productId
                        })),
                        total: order.totalAmount || '0.00',
                        address: this.parseAddress(order.addressSnapshot),
                        createdAt: order.createdAt,
                        reviewed: order.reviewed || false,
                        rawStatus: order.status
                    };
                });

                this.setData({ orders });
                this.filterOrders();
            }
        } catch (err) {
            console.error('Fetch orders failed', err);
        }
    },

    mapStatus(status) {
        const map = {
            'PENDING': 'payment',
            'PAID': 'shipment',
            'SHIPPED': 'receipt',
            'DELIVERED': 'review',
            'COMPLETED': 'completed',
            'CANCELLED': 'cancelled'
        };
        return map[status] || status;
    },

    formatStatus(status) {
        const map = {
            'PENDING': '待支付',
            'PAID': '待发货',
            'SHIPPED': '待收货',
            'DELIVERED': '待评价',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消'
        };
        return map[status] || status;
    },

    parseAddress(addressSnapshot) {
        if (!addressSnapshot) return null;
        let fullStr = addressSnapshot;
        try {
            const parsed = JSON.parse(addressSnapshot);
            fullStr = parsed.address || addressSnapshot;
        } catch (e) {
            fullStr = addressSnapshot;
        }

        const match = fullStr.match(/^(.*)\s+\((.*)\s+(.*)\)$/);
        if (match) {
            return {
                address: match[1],
                name: match[2],
                phone: match[3]
            };
        }

        // Fallback for address without (Name Phone) info
        return {
            address: fullStr,
            name: '用户', // Default label if not found
            phone: '暂无'
        };
    },

    handleTabClick(e) {
        const index = e.currentTarget.dataset.index;
        this.setData({ activeTab: index });
        this.filterOrders();
    },

    filterOrders() {
        const type = this.data.tabs[this.data.activeTab].type;
        if (type === 'all') {
            this.setData({ filteredOrders: this.data.orders });
        } else if (type === 'review') {
            const isPending = this.data.reviewFilter === 'pending';
            const filtered = this.data.orders.filter(o =>
                isPending ? o.status === 'review' : o.status === 'completed'
            );
            this.setData({ filteredOrders: filtered });
        } else if (type === 'completed') {
            // 已完成：所有 COMPLETED 状态的订单
            const filtered = this.data.orders.filter(o => o.rawStatus === 'COMPLETED');
            this.setData({ filteredOrders: filtered });
        } else {
            const filtered = this.data.orders.filter(o => o.status === type);
            this.setData({ filteredOrders: filtered });
        }
    },

    handlePay(e) {
        const orderId = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/user/payment/payment?orderId=${orderId}` });
    },

    handleTrace(e) {
        wx.showToast({ title: '商品正在运输中', icon: 'none' });
    },

    async handleConfirm(e) {
        const orderId = e.currentTarget.dataset.id;
        try {
            const res = await post(`/orders/${orderId}/receive`);
            if (res.code === 200) {
                wx.showToast({ title: '确认收货成功', icon: 'success' });
                this.fetchOrders();
            } else {
                wx.showToast({ title: res.message || '操作失败', icon: 'none' });
            }
        } catch (err) {
            wx.showToast({ title: '网络错误', icon: 'none' });
        }
    },

    handleComment(e) {
        const orderId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/user/review/review?orderId=${orderId}`
        });
    },

    async handleCancel(e) {
        const orderId = e.currentTarget.dataset.id;
        wx.showModal({
            title: '提示',
            content: '确定要取消此订单吗？',
            confirmColor: '#ff4d4f',
            success: async (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: '处理中...' });
                    try {
                        const res = await post(`/orders/${orderId}/cancel`);
                        wx.hideLoading();
                        if (res.code === 200) {
                            wx.showToast({ title: '订单已取消', icon: 'success' });
                            this.fetchOrders();
                        } else {
                            wx.showToast({ title: res.message || '取消失败', icon: 'none' });
                        }
                    } catch (err) {
                        wx.hideLoading();
                        wx.showToast({ title: '网络错误', icon: 'none' });
                    }
                }
            }
        });
    },

    handleReviewFilter(e) {
        const filter = e.currentTarget.dataset.filter;
        this.setData({ reviewFilter: filter });
        this.filterOrders();
    },

    async handleViewReview(e) {
        const orderId = e.currentTarget.dataset.orderId;
        const orderNo = e.currentTarget.dataset.orderNo || '';
        wx.showLoading({ title: '加载中...' });

        try {
            // 获取该订单的评价
            const res = await get(`/reviews/order/${orderId}`);
            wx.hideLoading();

            if (res.code === 200) {
                const reviews = (res.data || []).map(review => ({
                    id: review.id,
                    productName: review.product ? review.product.name : '商品',
                    productImage: review.product ? formatImageURL(review.product.image) : '',
                    rating: review.rating || 5,
                    content: review.content || '',
                    images: review.images ? review.images.split(',').filter(img => img).map(img => formatImageURL(img)) : [],
                    reply: review.reply || null
                }));

                this.setData({
                    currentReviews: reviews,
                    currentOrderNo: orderNo,
                    showReviewModal: true
                });
            } else {
                wx.showToast({ title: '获取评价失败', icon: 'none' });
            }
        } catch (err) {
            wx.hideLoading();
            console.error('Get reviews failed', err);
            wx.showToast({ title: '网络错误', icon: 'none' });
        }
    },

    closeReviewModal() {
        this.setData({
            showReviewModal: false,
            currentReviews: [],
            currentOrderNo: ''
        });
    }
})
