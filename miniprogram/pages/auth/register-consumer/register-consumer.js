// pages/auth/register-consumer/register-consumer.js
const app = getApp()

Page({
    data: {
        loading: false,
        account: '',
        password: '',
        nickname: ''
    },

    handleInput(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [field]: e.detail.value
        });
    },

    handleLogin() {
        wx.navigateTo({
            url: '/pages/auth/login-consumer/login-consumer'
        });
    },

    handleSubmit() {
        if (!this.data.account || !this.data.password || !this.data.nickname) {
            wx.showToast({ title: '请填写完整信息', icon: 'none' });
            return;
        }

        this.setData({ loading: true });

        const { post } = require('../../../utils/request.js');

        post('/auth/register', {
            phone: this.data.account,
            password: this.data.password,
            realName: this.data.nickname,
            role: 'CONSUMER'
        }).then(res => {
            if (res.code === 200) {
                wx.showToast({
                    title: '注册成功',
                    icon: 'success'
                });

                setTimeout(() => {
                    wx.navigateTo({
                        url: '/pages/auth/login-consumer/login-consumer'
                    });
                }, 1500);
            } else {
                wx.showToast({
                    title: res.message || '注册失败',
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
