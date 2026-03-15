const { get, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        product: null
    },

    onLoad(options) {
        if (options.id) {
            this.loadProduct(options.id);
        }
    },

    loadProduct(id) {
        wx.showLoading({ title: '加载中...' });
        get(`/products/${id}`).then(res => {
            if (res.code === 200) {
                const p = res.data.product;

                // Map status to feedback message
                let feedback = '';
                switch (p.status) {
                    case 'PENDING': feedback = '正在进行合规性审核，预计24小时内系统自动同步结果。'; break;
                    case 'REJECTED': feedback = '审核不通过，请检查图片清晰度或描述合规性。'; break;
                    case 'APPROVED': feedback = '审核通过，商品已在“乡味直连”平台正式挂牌在售。'; break;
                    case 'OFFLINE': feedback = '商品已下架。'; break;
                }

                this.setData({
                    product: {
                        id: p.id,
                        name: p.name,
                        image: formatImageURL(p.image),
                        images: p.images ? JSON.parse(p.images).map(img => formatImageURL(img)) : [],
                        stock: p.stock,
                        unit: p.unit || '斤',
                        sales: res.data.sales || 0,
                        coords: p.origin || '待完善',
                        cycle: '当季',
                        price: p.price,
                        description: p.description,
                        status: p.status,
                        feedback: feedback
                    }
                });
            }
        }).finally(() => {
            wx.hideLoading();
        });
    },

    handleEdit() {
        wx.navigateTo({
            url: `/pages/farmer/product_add/product_add?id=${this.data.product.id}`
        });
    },

    handleRefresh() {
        this.loadProduct(this.data.product.id);
    }
})
