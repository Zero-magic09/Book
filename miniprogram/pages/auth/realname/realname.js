// pages/auth/realname/realname.js
const { post } = require('../../../utils/request.js');

Page({
    data: {
        name: '',
        idCard: '',
        isAuthenticated: false,
        userId: null
    },

    onLoad(options) {
        const userInfo = wx.getStorageSync('userInfo');
        const userId = userInfo ? userInfo.userId : null;

        if (!userId) {
            wx.showToast({ title: '登录状态已失效', icon: 'none' });
            setTimeout(() => {
                wx.reLaunch({ url: '/pages/auth/login/login' });
            }, 1500);
            return;
        }

        this.setData({ userId });
        this.fetchRealNameInfo();
    },

    fetchRealNameInfo() {
        const { get } = require('../../../utils/request.js');
        get(`/users/${this.data.userId}/profile`).then(res => {
            if (res.code === 200 && res.data.idCard) {
                // If real name AND ID Card exists, consider it authenticated
                this.setData({
                    name: res.data.name,
                    idCard: res.data.idCard.replace(/^(\d{4})\d+(\d{4})$/, "$1**********$2"), // Masked display
                    isAuthenticated: true
                });
            }
        });
    },

    handleRetry() {
        this.setData({
            isAuthenticated: false,
            name: '',
            idCard: ''
        });
    },

    handleInput(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [field]: e.detail.value
        });
    },

    handleSubmit() {
        if (!this.data.name || !this.data.idCard) {
            wx.showToast({
                title: '请填写完整信息',
                icon: 'none'
            });
            return;
        }

        wx.showLoading({ title: '认证中...' });

        // 使用真实的API进行实名认证
        post(`/auth/realname?userId=${this.data.userId}&realName=${this.data.name}&idCard=${this.data.idCard}`, {})
            .then(res => {
                wx.hideLoading();
                if (res.code === 200) {
                    wx.showToast({
                        title: '认证成功',
                        icon: 'success'
                    });
                    this.setData({ isAuthenticated: true });

                    // 同步更新缓存中的用户信息
                    const userInfo = wx.getStorageSync('userInfo') || {};
                    userInfo.realName = this.data.name;
                    wx.setStorageSync('userInfo', userInfo);

                    setTimeout(() => {
                        wx.navigateBack();
                    }, 1500);
                } else {
                    wx.showToast({
                        title: res.message || '认证失败',
                        icon: 'none'
                    });
                }
            })
            .catch(err => {
                wx.hideLoading();
                console.error(err);
            });
    }
})

