const { get, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        activeTab: 'products',
        tabItems: [
            { id: 'home', label: '工作台', icon: '🌱' },
            { id: 'products', label: '商品库', icon: '📦' },
            { id: 'orders', label: '订单管理', icon: '📑' },
            { id: 'me', label: '农场主', icon: '👤' }
        ],
        products: []
    },

    onLoad(options) {
        this.loadProducts();
    },

    onShow() {
        wx.hideHomeButton();
        // 每次显示时刷新产品列表（如从编辑页返回）
        this.loadProducts();
    },

    loadProducts() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const farmerId = storedUser ? storedUser.farmerId : null;

        if (!farmerId) {
            console.error('未找到农户ID');
            return Promise.reject('未找到农户ID');
        }

        return get('/farmer/products', { farmerId }).then(res => {
            if (res.code === 200) {
                // 转换产品状态为前端需要的格式
                const products = (res.data || []).map(p => {
                    return {
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        stock: p.stock,
                        unit: p.unit || '份',
                        image: formatImageURL(p.image || 'https://picsum.photos/seed/product/200/200'),
                        status: this.mapStatus(p.status)
                    };
                });
                this.setData({ products });
            }
        }).catch(err => {
            console.error('加载产品列表失败:', err);
        });
    },

    onPullDownRefresh() {
        this.loadProducts().then(() => {
            wx.stopPullDownRefresh();
            wx.showToast({ title: '刷新成功', icon: 'success' });
        }).catch(() => {
            wx.stopPullDownRefresh();
        });
    },

    mapStatus(backendStatus) {
        const statusMap = {
            'APPROVED': 'published',
            'PENDING': 'pending',
            'REJECTED': 'rejected',
            'OFFLINE': 'offline'
        };
        return statusMap[backendStatus] || 'pending';
    },

    handleAddProduct() {
        wx.navigateTo({ url: '/pages/farmer/product_add/product_add' });
    },

    handleEdit(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/farmer/product_add/product_add?id=${id}`
        });
    },

    handleToggleStatus(e) {
        wx.showToast({ title: '上下架状态切换', icon: 'none' });
    },

    handleViewDetail(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/farmer/product_detail/product_detail?id=${id}`
        });
    },

    handleTabSelect(e) {
        const tabId = e.detail.id || e.detail;
        if (tabId === 'products') return;

        const urls = {
            home: '/pages/farmer/dashboard/dashboard',
            orders: '/pages/farmer/orders/orders',
            me: '/pages/farmer/profile/profile'
        };

        if (urls[tabId]) wx.reLaunch({ url: urls[tabId] });
    }
})
