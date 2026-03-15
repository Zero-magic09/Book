// pages/user/coupon_market/coupon_market.js
const app = getApp();
const { get, post } = require('../../../utils/request.js');

Page({
    data: {
        coupons: [],
        userId: null
    },

    onLoad() {
        const userId = wx.getStorageSync('userId') || 5;
        this.setData({ userId });
        this.fetchMarketCoupons();
    },

    fetchMarketCoupons() {
        get(`/coupons/market?userId=${this.data.userId}`).then(res => {
            if (res.code === 200) {
                const coupons = res.data.map(c => ({
                    id: c.id,
                    name: c.name,
                    value: c.value,
                    condition: c.minSpend > 0 ? `满${c.minSpend}可用` : '无门槛',
                    expiry: c.endTime ? c.endTime.substring(0, 10) : '长期有效',
                    claimed: c.claimed,
                    remaining: c.remaining,
                    percent: Math.min(100, Math.floor((1 - c.remaining / (c.totalCount || 100)) * 100)) // approximation if totalCount missing
                }));
                this.setData({ coupons });
            }
        });
    },

    handleClaim(e) {
        const id = e.currentTarget.dataset.id;
        wx.showLoading({ title: '领取中' });
        post(`/coupons/${id}/claim`, { userId: this.data.userId }).then(res => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({ title: '领取成功', icon: 'success' });
                this.fetchMarketCoupons(); // Refresh status
            } else {
                wx.showToast({ title: res.message || '领取失败', icon: 'none' });
            }
        });
    }
})
