// pages/common/about/about.js
Page({
    data: {
        version: '1.0.0'
    },

    onLoad(options) {

    },

    handleCopy(e) {
        wx.setClipboardData({
            data: 'contact@xiangvei.com',
            success: function () {
                wx.showToast({
                    title: '已复制邮箱',
                });
            }
        });
    }
})
