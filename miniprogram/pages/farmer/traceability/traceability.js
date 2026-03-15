// pages/farmer/traceability/traceability.js
const { get, post } = require('../../../utils/request.js');
const app = getApp();

Page({
    data: {
        products: [], // Product names for picker
        productList: [], // Full product objects
        productIndex: null,
        recordTypes: ['播种', '浇水', '施肥', '病虫害防治', '采摘', '除草', '包装', '发货'],
        selectedType: '施肥',
        content: '',
        images: []
    },

    onLoad(options) {
        this.loadProducts();
    },

    loadProducts() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const farmerId = storedUser ? storedUser.farmerId : null;

        if (!farmerId) {
            wx.showToast({ title: '未找到农户信息', icon: 'none' });
            return;
        }

        get('/farmer/products', { farmerId }).then(res => {
            if (res.code === 200) {
                const productList = res.data || [];
                const products = productList.map(p => p.name);
                this.setData({
                    products,
                    productList
                });
            }
        });
    },

    handleProductChange(e) {
        this.setData({
            productIndex: e.detail.value
        });
    },

    handleTypeSelect(e) {
        const type = e.currentTarget.dataset.type;
        this.setData({
            selectedType: type
        });
    },

    handleInput(e) {
        this.setData({
            content: e.detail.value
        });
    },

    handleAddImage() {
        wx.chooseImage({
            count: 1,
            success: (res) => {
                const images = this.data.images.concat(res.tempFilePaths);
                this.setData({ images });
            }
        });
    },

    handleSubmit() {
        if (this.data.productIndex === null) {
            wx.showToast({ title: '请选择农产品', icon: 'none' });
            return;
        }

        // Since backend trace table is removed, we just simulate success for UI demo
        wx.showLoading({ title: '提交中...' });

        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
                title: '更新成功',
                icon: 'success',
                duration: 2000,
                success: () => {
                    setTimeout(() => {
                        wx.navigateBack();
                    }, 2000);
                }
            });
        }, 1500);
    }
})
