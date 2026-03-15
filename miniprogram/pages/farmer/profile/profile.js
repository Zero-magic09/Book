// pages/farmer/profile/profile.js
const app = getApp();
const { get, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        activeTab: 'me',
        tabItems: [
            { id: 'home', label: '工作台', icon: '🌱' },
            { id: 'products', label: '商品库', icon: '📦' },
            { id: 'orders', label: '订单管理', icon: '📑' },
            { id: 'me', label: '农场主', icon: '👤' }
        ],
        farmerInfo: {
            name: '加载中...',
            farmName: '',
            avatar: ''
        },
        stats: [
            { id: 1, val: '0', label: '入驻天数' },
            { id: 2, val: '0', label: '累计评价' },
            { id: 3, val: '-', label: '农场排名' }
        ],
        menuItems: [
            { icon: '📝', label: '基本信息', status: '查看', statusColor: 'text-gray-300', url: '/pages/farmer/info/info' },
            { icon: '🆔', label: '实名认证', status: '去认证', statusColor: 'text-yellow-500', url: '/pages/auth/realname/realname' },
            { icon: '🏦', label: '结算账户', status: '未绑定', statusColor: 'text-rose-500', url: '/pages/farmer/account/account' },
            { icon: '📸', label: '农场实拍', status: '暂无照片', statusColor: 'text-gray-300', url: '/pages/farmer/real-shot/real-shot' },
            { icon: '⭐', label: '评价管理', status: '暂无评价', statusColor: 'text-gray-300', url: '/pages/farmer/reviews/reviews' }
        ]
    },

    onLoad(options) {
        this.loadFarmerProfile();
    },

    onShow() {
        wx.hideHomeButton();
        this.loadFarmerProfile();
    },

    loadFarmerProfile() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const farmerId = storedUser ? storedUser.farmerId : null;

        if (!farmerId) {
            console.error('未找到农户ID');
            return;
        }

        get(`/farmer/${farmerId}/profile`).then(res => {
            if (res.code === 200) {
                const data = res.data;
                const farmerInfo = data.farmerInfo || this.data.farmerInfo;
                if (farmerInfo.avatar) {
                    farmerInfo.avatar = formatImageURL(farmerInfo.avatar);
                }

                this.setData({
                    farmerInfo: farmerInfo,
                    stats: data.stats || this.data.stats,
                    menuItems: data.menuItems || this.data.menuItems
                });
            }
        }).catch(err => {
            console.error('加载农户资料失败:', err);
        });
    },

    handleEditProfile() {
        wx.navigateTo({
            url: '/pages/common/personal-info/personal-info?role=farmer'
        });
    },

    handleLogout() {
        wx.showModal({
            title: '退出登录',
            content: '确定要退出农户端吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.reLaunch({
                        url: '/pages/index/index'
                    });
                }
            }
        });
    },

    handleTabSelect(e) {
        const tabId = e.detail.id || e.detail;
        if (tabId === 'me') return;

        const urls = {
            home: '/pages/farmer/dashboard/dashboard',
            products: '/pages/farmer/products/products',
            orders: '/pages/farmer/orders/orders'
        };

        if (urls[tabId]) wx.reLaunch({ url: urls[tabId] });
    },

    handleMenuClick(e) {
        // 由于是从后端动态获取的 menuItems，需要通过某种方式识别点击项
        // 这里简单使用 label 匹配，或者在 wxml 中传递 data-url
        const url = e.currentTarget.dataset.url;
        if (url) {
            wx.navigateTo({ url });
        } else {
            wx.showToast({ title: '功能开发中', icon: 'none' });
        }
    }
})
