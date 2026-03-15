// pages/farmer/reviews/reviews.js
const app = getApp();
const { get, post, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        activeTab: 'all',
        reviews: [],
        farmerId: null
    },

    onLoad() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const farmerId = storedUser ? storedUser.farmerId : null;
        if (farmerId) {
            this.setData({ farmerId });
            this.fetchReviews();
        } else {
            wx.showToast({ title: '无法获取农户信息', icon: 'none' });
        }
    },

    onShow() {
        if (this.data.farmerId) {
            this.fetchReviews();
        }
    },

    fetchReviews() {
        get(`/reviews/farmer/${this.data.farmerId}`).then(res => {
            if (res.code === 200) {
                const reviews = res.data.map(r => ({
                    id: r.id,
                    name: r.user ? (r.user.nickName || r.user.realName || '匿名用户') : '匿名用户',
                    avatar: formatImageURL(r.user ? r.user.avatar : ''),
                    date: this.formatDate(r.createdAt),
                    rating: r.rating,
                    content: r.content,
                    images: r.images ? r.images.split(',').map(img => formatImageURL(img.trim())) : [],
                    productName: r.product ? r.product.name : '未知商品',
                    reply: r.reply,
                    replyInput: ''
                }));
                this.setData({ reviews });
            }
        });
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        if (Array.isArray(dateStr)) {
            // Handle [2024, 1, 1, 12, 0, 0]
            const [year, month, day] = dateStr;
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        // Handle "2024-01-01T..."
        return dateStr.toString().substring(0, 10);
    },

    handleTabChange(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ activeTab: tab });

        // Filter logic could be implemented if backend supported it or filter locally
        // For now, let's keep all. Or implement local filter if needed.
        // Assuming 'all' shows all. If tab is 'pending', we filter locally.
    },

    getFilteredReviews() {
        if (this.data.activeTab === 'pending') {
            return this.data.reviews.filter(r => !r.reply);
        }
        return this.data.reviews;
    },

    handleReplyInput(e) {
        const { id } = e.currentTarget.dataset;
        const value = e.detail.value;
        const index = this.data.reviews.findIndex(r => r.id === id);
        if (index !== -1) {
            this.setData({
                [`reviews[${index}].replyInput`]: value
            });
        }
    },

    submitReply(e) {
        const { id } = e.currentTarget.dataset;
        const index = this.data.reviews.findIndex(r => r.id === id);
        if (index !== -1) {
            const input = this.data.reviews[index].replyInput;
            if (!input || input.trim() === '') {
                wx.showToast({ title: '请输入回复内容', icon: 'none' });
                return;
            }

            wx.showLoading({ title: '提交中' });
            post(`/reviews/${id}/reply`, { content: input }).then(res => {
                wx.hideLoading();
                if (res.code === 200) {
                    this.setData({
                        [`reviews[${index}].reply`]: input,
                        [`reviews[${index}].replyInput`]: ''
                    });
                    wx.showToast({ title: '回复成功' });
                } else {
                    wx.showToast({ title: res.message || '回复失败', icon: 'none' });
                }
            });
        }
    }
})
