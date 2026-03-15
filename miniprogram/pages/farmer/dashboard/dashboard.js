// pages/farmer/dashboard/dashboard.js
const app = getApp();
const { get, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        activeTab: 'home',
        // Top Card Info
        farmerInfo: {
            name: '加载中...',
            location: '',
            verified: false,
            avatar: ''
        },
        // Stats Row
        stats: [
            { id: 1, value: 0, label: '待发货', color: '#f59e0b' },
            { id: 2, value: 0, label: '月营收', color: '#10b981', prefix: '¥ ' },
            { id: 3, value: 0, label: '在售商品', color: '#3b82f6' }
        ],
        // Real-time Orders
        orders: [],
        tabItems: [
            { id: 'home', label: '工作台', icon: '🌱' },
            { id: 'products', label: '商品库', icon: '📦' },
            { id: 'orders', label: '订单管理', icon: '📑' },
            { id: 'me', label: '农场主', icon: '👤' }
        ]
    },

    onLoad() {
        this.loadDashboard();
    },

    onShow() {
        wx.hideHomeButton();
        this.loadDashboard();
    },

    loadDashboard() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const farmerId = storedUser ? storedUser.farmerId : null;

        if (!farmerId) {
            console.error('未找到农户ID');
            this.setData({
                farmerInfo: {
                    name: '未登录',
                    location: '请先登录农户账号',
                    verified: false,
                    avatar: ''
                }
            });
            return;
        }

        get(`/farmer/${farmerId}/dashboard`).then(res => {
            if (res.code === 200) {
                const data = res.data;
                const farmerInfo = data.farmerInfo || this.data.farmerInfo;
                if (farmerInfo.avatar) {
                    farmerInfo.avatar = formatImageURL(farmerInfo.avatar);
                }

                const orders = (data.orders || []).map(o => ({
                    ...o,
                    image: formatImageURL(o.image)
                }));

                this.setData({
                    farmerInfo,
                    stats: data.stats || this.data.stats,
                    orders
                });
            }
        }).catch(err => {
            console.error('加载仪表盘数据失败:', err);
        });
    },

    handleTabSelect(e) {
        const tabId = e.detail.id || e.detail;
        if (tabId === 'home') return;

        const urls = {
            products: '/pages/farmer/products/products',
            orders: '/pages/farmer/orders/orders',
            me: '/pages/farmer/profile/profile'
        };

        if (urls[tabId]) wx.reLaunch({ url: urls[tabId] });
    },



    handleAddProduct() {
        wx.navigateTo({ url: '/pages/farmer/product_add/product_add' });
    },

    handleUpdateLog() {
        wx.navigateTo({ url: '/pages/farmer/traceability/traceability' });
    },

    viewAllOrders() {
        wx.reLaunch({ url: '/pages/farmer/orders/orders' });
    },

    handleStatClick(e) {
        const id = e.currentTarget.dataset.id;
        if (id === 1) { // 待发货
            wx.reLaunch({ url: '/pages/farmer/orders/orders' });
        } else if (id === 3) { // 在售商品
            wx.reLaunch({ url: '/pages/farmer/products/products' });
        }
    }
})
