// pages/user/coupons/coupons.js
const app = getApp();
const { get } = require('../../../utils/request.js');

Page({
    data: {
        coupons: [],
        userId: null
    },

    onLoad() {
        const userInfo = wx.getStorageSync('userInfo');
        const userId = userInfo ? userInfo.userId : null;
        this.setData({ userId });
        this.fetchCoupons();
    },

    onShow() {
        this.fetchCoupons();
    },

    fetchCoupons() {
        if (!this.data.userId) return;

        get(`/coupons/my?userId=${this.data.userId}&status=3`).then(res => {
            if (res.code === 200) {
                const coupons = res.data.map(c => ({
                    id: c.id,
                    amount: c.value,
                    condition: c.minSpend > 0 ? `满${c.minSpend}使用` : '无门槛',
                    name: c.name,
                    expiry: c.endTime ? c.endTime.replace('T', ' ').substring(0, 16) : '长期有效',
                    status: this.getStatusText(c.status), // 'unused', 'used', 'expired'
                    statusCode: c.status,
                    color: '#ef4444' // dynamic color if needed
                }));
                this.setData({ coupons });
            }
        });
    },

    getStatusText(status) {
        if (status === 0) return 'unused';
        if (status === 1) return 'used';
        if (status === 2) return 'expired';
        return 'unknown';
    },

    handleUse(e) {
        wx.switchTab({
            url: '/pages/user/marketplace/marketplace'
        });
    },

    goToMarket() {
        wx.navigateTo({
            url: '/pages/user/coupon_market/coupon_market'
        });
    }
})
