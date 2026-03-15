// pages/auth/register/register.js
const app = getApp()

Page({
    data: {
        role: 'CONSUMER',
        title: '新用户注册',
        loading: false,
        account: '',
        password: ''
    },

    onLoad(options) {
        const role = options.role || 'CONSUMER';
        let title = '新用户注册';
        if (role === 'FARMER') title = '农户注册';
        if (role === 'ADMIN') title = '管理员注册';

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

    handleLogin() {
        wx.navigateBack();
    },

    handleSubmit() {
        this.setData({ loading: true });

        // Mock register delay
        setTimeout(() => {
            this.setData({ loading: false });
            wx.showToast({
                title: '注册成功',
                icon: 'success'
            });

            // Navigate to login page after registration
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }, 1000);
    }
})
