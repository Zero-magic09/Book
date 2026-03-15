const { get, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        activeTab: 'profile',
        tabItems: [
            { id: 'market', label: '集市', icon: '🏪' },
            { id: 'cart', label: '购物车', icon: '🛒' },
            { id: 'trace', label: '溯源', icon: '🔍' },
            { id: 'profile', label: '我的', icon: '👤' }
        ],
        userInfo: {
            nickname: '加载中...',
            tag: '',
            avatar: ''
        },
        stats: {
            footprint: 0,
            favorites: 0,
            points: 0
        },
        orderStats: {
            payment: 0,
            shipment: 0,
            receipt: 0,
            review: 0
        },
        services: [
            { id: 1, icon: '📍', name: '收货地址', desc: '管理地址', url: '/pages/user/addresses/addresses' },
            { id: 2, icon: '🆔', name: '实名认证', desc: '去认证', descColor: '#f59e0b', url: '/pages/auth/realname/realname' },
            { id: 3, icon: '🎟️', name: '领券中心', desc: '查看优惠', url: '/pages/user/coupons/coupons' },
            { id: 4, icon: '🍃', name: '关于乡味', desc: '了解我们', url: '/pages/common/about/about' }
        ]
    },

    onLoad() {
        this.loadUserProfile();
    },

    onShow() {
        wx.hideHomeButton();
        // 每次显示时刷新用户信息（如从编辑页返回）
        this.loadUserProfile();
    },

    loadUserProfile() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const userId = storedUser ? storedUser.userId : null;

        if (!userId) {
            // 未登录，显示默认信息并提示登录
            this.setData({
                userInfo: {
                    nickname: '未登录',
                    tag: '点击登录',
                    avatar: formatImageURL('')
                }
            });
            return;
        }

        // 获取用户基本信息
        get(`/users/${userId}/profile`).then(res => {
            if (res.code === 200) {
                const data = res.data;
                this.setData({
                    userInfo: {
                        nickname: data.name || storedUser.realName || '用户',
                        tag: data.roleTag || '普通用户',
                        avatar: formatImageURL(data.avatar)
                    },
                    stats: {
                        footprint: data.footprintCount || 0,
                        favorites: data.favoritesCount || 0,
                        points: data.points || 0
                    }
                });

                // 更新实名认证状态
                if (storedUser.realName) {
                    const services = this.data.services;
                    services[1].desc = '已认证';
                    services[1].descColor = '#10b981';
                    this.setData({ services });
                }
            }
        }).catch(err => {
            console.error('加载用户信息失败:', err);
        });

        // 获取订单统计
        get(`/orders/user/${userId}/stats`).then(res => {
            if (res.code === 200) {
                this.setData({
                    orderStats: res.data
                });
            }
        }).catch(err => {
            console.error('加载订单统计失败:', err);
        });

        // 获取服务摘要（地址数量、实名认证状态等）
        get(`/users/${userId}/services`).then(res => {
            if (res.code === 200) {
                const data = res.data;
                const services = this.data.services;

                // 更新收货地址描述
                services[0].desc = data.addressDesc || '管理地址';

                // 更新实名认证状态
                services[1].desc = data.verifiedDesc || '去认证';
                services[1].descColor = data.verified ? '#10b981' : '#f59e0b';

                // 更新优惠券描述
                services[2].desc = data.couponCount > 0 ? data.couponCount + '张可用' : '查看优惠';

                this.setData({ services });
            }
        }).catch(err => {
            console.error('加载服务摘要失败:', err);
        });
    },

    handleTabSelect(e) {
        const tabId = e.detail.id || e.detail;
        if (tabId === 'profile') return;

        const urls = {
            market: '/pages/user/marketplace/marketplace',
            cart: '/pages/user/cart/cart',
            trace: '/pages/user/traceability/traceability'
        };

        if (urls[tabId]) wx.reLaunch({ url: urls[tabId] });
    },

    navigateTo(e) {
        const url = e.currentTarget.dataset.url;
        wx.navigateTo({ url });
    },

    navigateToOrders(e) {
        const type = e.currentTarget.dataset.type || 'all';
        wx.navigateTo({
            url: `/pages/user/orders/orders?type=${type}`
        });
    },

    showSettings() {
        wx.showToast({
            title: '功能开发中',
            icon: 'none'
        });
    },

    handleEditProfile() {
        wx.navigateTo({
            url: '/pages/common/personal-info/personal-info?role=consumer'
        });
    },

    handleLogout() {
        wx.showModal({
            title: '退出登录',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.reLaunch({
                        url: '/pages/index/index'
                    });
                }
            }
        });
    }
})
