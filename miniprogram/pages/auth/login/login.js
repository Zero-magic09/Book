// pages/auth/login/login.js
const app = getApp()

Page({
    data: {
        role: 'CONSUMER',
        title: '消费者登录',
        loading: false,
        account: '',
        password: ''
    },

    onLoad(options) {
        const role = options.role || 'CONSUMER';
        let title = '消费者登录';
        if (role === 'FARMER') title = '农户登录';
        if (role === 'ADMIN') title = '管理员登录';

        this.setData({
            role,
            title
        });
    },

    handleBack() {
        wx.navigateBack();
    },

    handleInput(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [field]: e.detail.value
        });
    },

    handleRegister() {
        wx.navigateTo({
            url: `/pages/auth/register/register?role=${this.data.role}`
        });
    },

    handleSubmit() {
        if (!this.data.account || !this.data.password) {
            wx.showToast({ title: '请输入账号和密码', icon: 'none' });
            return;
        }

        this.setData({ loading: true });

        const { post } = require('../../../utils/request.js');

        console.log('Attempting login for:', this.data.account, 'as role:', this.data.role);

        post('/auth/login', {
            phone: this.data.account,
            password: this.data.password
        }).then(res => {
            console.log('Login response:', res);
            if (res.code === 200) {
                const userInfo = res.data;
                wx.setStorageSync('token', userInfo.token);
                wx.setStorageSync('userInfo', userInfo);
                app.globalData.userInfo = userInfo;
                app.globalData.role = userInfo.role;

                wx.showToast({
                    title: '登录成功',
                    icon: 'success'
                });

                setTimeout(() => {
                    // Role based navigation
                    if (userInfo.role === 'CONSUMER') {
                        wx.reLaunch({ url: '/pages/user/marketplace/marketplace' });
                    } else if (userInfo.role === 'FARMER') {
                        wx.reLaunch({ url: '/pages/farmer/dashboard/dashboard' });
                    } else if (userInfo.role === 'ADMIN') {
                        wx.reLaunch({ url: '/pages/admin/dashboard/dashboard' });
                    }
                }, 1000);
            } else {
                wx.showToast({
                    title: res.message || '登录失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            console.error('Login error:', err);
        }).finally(() => {
            this.setData({ loading: false });
        });
    }
})
