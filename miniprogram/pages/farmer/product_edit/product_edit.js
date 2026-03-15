// pages/farmer/product_edit/product_edit.js
Page({
    data: {
        product: {
            name: '精选红富士苹果',
            price: '39.9',
            stock: '450',
            cycle: '180天自然成熟',
            description: '使用花生麸发酵有机肥，无化学农药。',
            images: [
                'https://picsum.photos/seed/apple/200/200'
            ]
        }
    },

    onLoad(options) {
        if (options.id) {
            // Fetch product details by ID if needed
            // this.loadProduct(options.id);
        }
    },

    handleSave() {
        wx.showToast({
            title: '提交审核成功',
            icon: 'success',
            duration: 2000,
            success: () => {
                setTimeout(() => {
                    wx.navigateBack();
                }, 2000);
            }
        });
    },

    handleAddImage() {
        wx.chooseImage({
            count: 1,
            success: (res) => {
                const images = this.data.product.images.concat(res.tempFilePaths);
                this.setData({
                    'product.images': images
                });
            }
        });
    }
})
