const { get, post } = require('../../../utils/request.js');

Page({
    data: {
        orderId: null,
        items: [],
        reviews: [], // { productId, rating, content, images }
        loading: false
    },

    onLoad(options) {
        const orderId = options.orderId;
        if (!orderId) {
            wx.showToast({ title: '参数错误', icon: 'none' });
            return;
        }
        this.setData({ orderId });
        this.fetchOrderDetails(orderId);
    },

    async fetchOrderDetails(orderId) {
        try {
            const res = await get(`/orders/${orderId}`);
            if (res.code === 200) {
                const order = res.data;
                const orderItems = order.items || [];

                // 新结构：从订单明细中获取商品信息
                const items = orderItems.map(item => ({
                    productId: item.product ? item.product.id : item.productId,
                    name: item.productName,
                    image: item.productImage,
                    rating: 5,
                    content: '',
                    images: []
                }));

                this.setData({ items: items.length > 0 ? items : [] });
            }
        } catch (err) {
            console.error(err);
        }
    },

    handleRating(e) {
        const { index, rating } = e.currentTarget.dataset;
        const key = `items[${index}].rating`;
        this.setData({ [key]: rating });
    },

    handleContentInput(e) {
        const index = e.currentTarget.dataset.index;
        const value = e.detail.value;
        const key = `items[${index}].content`;
        this.setData({ [key]: value });
    },

    // Submit reviews for ALL products in the order
    async handleSubmit() {
        const items = this.data.items;
        if (!items || items.length === 0) {
            wx.showToast({ title: '没有可评价的商品', icon: 'none' });
            return;
        }

        if (this.data.loading) return;
        this.setData({ loading: true });

        try {
            const userInfo = wx.getStorageSync('userInfo');
            let successCount = 0;
            let errorMessage = '';

            // Submit reviews for all products
            for (const item of items) {
                if (!item.content || item.content.trim() === '') {
                    // Skip items without content (optional: or require all)
                    continue;
                }

                try {
                    const res = await post('/reviews', {
                        userId: userInfo.userId,
                        orderId: this.data.orderId,
                        productId: item.productId,
                        rating: item.rating,
                        content: item.content,
                        images: item.images.join(',')
                    });

                    if (res.code === 200) {
                        successCount++;
                    } else {
                        errorMessage = res.message || '部分评价失败';
                    }
                } catch (err) {
                    console.error('Review submission error for product:', item.productId, err);
                    errorMessage = '网络异常';
                }
            }

            if (successCount > 0) {
                wx.showToast({ title: `成功评价 ${successCount} 个商品`, icon: 'success' });
                setTimeout(() => {
                    const pages = getCurrentPages();
                    const prevPage = pages[pages.length - 2];
                    if (prevPage && prevPage.fetchOrders) {
                        prevPage.fetchOrders();
                    }
                    wx.navigateBack();
                }, 1500);
            } else if (errorMessage) {
                wx.showToast({ title: errorMessage, icon: 'none' });
            } else {
                wx.showToast({ title: '请至少填写一条评价内容', icon: 'none' });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '网络异常', icon: 'none' });
        } finally {
            this.setData({ loading: false });
        }
    }
});
