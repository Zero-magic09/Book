// pages/auth/login-consumer/login-consumer.js
const app = getApp()

Page({
    data: {
        loading: false,
        account: '',
        password: ''
    },

    handleInput(e) {
        const field = e.currentTarget.dataset.field || e.target.dataset.field;
        console.log(`Input ${field}:`, e.detail.value);
        this.setData({
            [field]: e.detail.value
        });
    },

    handleRegister() {
        wx.navigateTo({
            url: '/pages/auth/register-consumer/register-consumer'
        });
    },

    handleSubmit() {
        if (!this.data.account || !this.data.password) {
            wx.showToast({ title: '请输入账号和密码', icon: 'none' });
            return;
        }

        this.setData({ loading: true });

        const { post } = require('../../../utils/request.js');

        console.log('Consumer login attempt:', this.data.account);

        post('/auth/login', {
            phone: this.data.account,
            password: this.data.password
        }).then(res => {
            console.log('Login response:', res);
            if (res.code === 200) {
                const userInfo = res.data;
                wx.setStorageSync('token', userInfo.token);
                wx.setStorageSync('userInfo', userInfo);
                wx.setStorageSync('userId', userInfo.userId);
                app.globalData.userInfo = userInfo;
                app.globalData.role = userInfo.role;

                if (userInfo.role !== 'CONSUMER') {
                    wx.showToast({ title: '非消费者账号', icon: 'none' });
                    // Optional: clear storage if you don't want to keep the session
                    wx.removeStorageSync('token');
                    wx.removeStorageSync('userInfo');
                    return;
                }

                wx.showToast({
                    title: '登录成功',
                    icon: 'success'
                });

                setTimeout(() => {
                    wx.reLaunch({ url: '/pages/user/marketplace/marketplace' });
                }, 1000);
            } else {
                wx.showToast({
                    title: res.message || '登录失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            console.error(err);
        }).finally(() => {
            this.setData({ loading: false });
        });
    }
})
