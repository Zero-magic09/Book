// pages/farmer/product_add/product_add.js
const app = getApp();
const { post, put, get, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        id: null,
        product: {
            name: '',
            price: '',
            stock: '',
            unit: '斤',
            description: '',
            origin: '',
            category: '果蔬',
            image: '',
            images: '[]',
            specs: '默认规格'
        },
        tempImages: [], // 本地临时路径用于预览
        serverImages: [], // 服务器返回的 URL 列表
        tags: [
            { id: 1, name: '当季鲜采', checked: false },
            { id: 2, name: '现摘现发', checked: false },
            { id: 3, name: '有机认证', checked: false },
            { id: 4, name: '地理标志', checked: false }
        ],
        categories: ['果蔬', '粮油', '畜禽', '干货'],
        customTagInput: '' // 手动输入的标签内容
    },

    onLoad(options) {
        if (options.id) {
            this.setData({ id: options.id });
            wx.setNavigationBarTitle({ title: '编辑商品' });
            this.loadProduct(options.id);
        } else {
            wx.setNavigationBarTitle({ title: '发布新商品' });
        }
    },

    loadProduct(id) {
        get(`/products/${id}`).then(res => {
            if (res.code === 200) {
                const p = res.data.product; // Backend returns Map with 'product' key
                const badges = p.badge ? p.badge.split(',') : [];

                // Update tags status and identify custom tags
                const defaultTagNames = this.data.tags.map(t => t.name);
                const customTags = badges
                    .filter(name => !defaultTagNames.includes(name))
                    .map((name, index) => ({ id: 100 + index, name, checked: true }));

                const newTags = [
                    ...this.data.tags.map(t => ({
                        ...t,
                        checked: badges.includes(t.name)
                    })),
                    ...customTags
                ];

                // Parse images
                let serverImages = [];
                try {
                    serverImages = JSON.parse(p.images || '[]');
                } catch (e) {
                    serverImages = p.image ? [p.image] : [];
                }

                const tempImages = serverImages.map(url => formatImageURL(url));

                this.setData({
                    product: {
                        name: p.name,
                        price: p.price,
                        stock: p.stock,
                        unit: p.unit || '斤',
                        description: p.description || '',
                        origin: p.origin || '',
                        category: p.category || '果蔬',
                        image: p.image || '',
                        images: p.images || '[]',
                        specs: p.specs
                    },
                    tags: newTags,
                    serverImages: serverImages,
                    tempImages: tempImages
                });
            }
        });
    },

    handleInput(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [`product.${field}`]: e.detail.value
        });
    },

    chooseImage() {
        const count = 6 - this.data.tempImages.length;
        wx.chooseMedia({
            count: count,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const files = res.tempFiles;
                files.forEach(file => {
                    this.uploadOneFile(file.tempFilePath);
                });
            }
        });
    },

    uploadOneFile(filePath) {
        wx.showLoading({ title: '上传中...' });
        const baseUrl = 'http://localhost:8080';
        wx.uploadFile({
            url: baseUrl + '/api/common/upload',
            filePath: filePath,
            name: 'file',
            header: {
                'Authorization': 'Bearer ' + wx.getStorageSync('token')
            },
            success: (res) => {
                const data = JSON.parse(res.data);
                if (data.code === 200) {
                    const serverUrl = data.data; // e.g., /uploads/xxx.jpg

                    const tempImages = [...this.data.tempImages, baseUrl + serverUrl];
                    const serverImages = [...this.data.serverImages, serverUrl];

                    this.setData({
                        tempImages,
                        serverImages
                    });
                } else {
                    wx.showToast({ title: data.message || '上传失败', icon: 'none' });
                }
            },
            fail: (err) => {
                console.error('Upload failed', err);
                wx.showToast({ title: '网络异常', icon: 'none' });
            },
            complete: () => {
                wx.hideLoading();
            }
        });
    },

    removeImage(e) {
        const index = e.currentTarget.dataset.index;
        const tempImages = [...this.data.tempImages];
        const serverImages = [...this.data.serverImages];

        tempImages.splice(index, 1);
        serverImages.splice(index, 1);

        this.setData({
            tempImages,
            serverImages
        });
    },

    previewImage(e) {
        const url = e.currentTarget.dataset.url;
        wx.previewImage({
            urls: this.data.tempImages,
            current: url
        });
    },

    handleTagToggle(e) {
        const index = e.currentTarget.dataset.index;
        const tags = this.data.tags;
        tags[index].checked = !tags[index].checked;
        this.setData({
            tags: tags
        });
    },

    handleCategoryChange(e) {
        const idx = e.detail.value;
        this.setData({
            'product.category': this.data.categories[idx]
        });
    },

    handleCustomTagInput(e) {
        this.setData({ customTagInput: e.detail.value });
    },

    addCustomTag() {
        const name = this.data.customTagInput.trim();
        if (!name) return;

        // Check if tag already exists (case-insensitive)
        const exists = this.data.tags.some(t => t.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            wx.showToast({ title: '标签已存在', icon: 'none' });
            return;
        }

        const newTag = {
            id: Date.now(),
            name,
            checked: true
        };

        this.setData({
            tags: [...this.data.tags, newTag],
            customTagInput: ''
        });
    },

    handleSubmit() {
        const { name, price, stock, unit, origin, description, category } = this.data.product;
        const images = this.data.serverImages;

        // Verify all fields are filled
        if (!name) return this.showErr('请填写产品名称');
        if (!price) return this.showErr('请填写产品单价');
        if (!stock) return this.showErr('请填写库存数量');
        if (!unit) return this.showErr('请填写产品单位');
        if (!origin) return this.showErr('请填写产地信息');
        if (!description) return this.showErr('请填写产品描述');
        if (!category) return this.showErr('请选择产品分类');
        if (images.length === 0) return this.showErr('请至少上传一张产品图片');

        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const farmerId = storedUser ? storedUser.farmerId : null;

        if (!farmerId) {
            wx.showToast({ title: '无法获取农户身份', icon: 'none' });
            return;
        }

        // Collect tags
        const badge = this.data.tags
            .filter(t => t.checked)
            .map(t => t.name)
            .join(',');

        // Prepare image data
        const mainImage = images[0];
        const allImages = JSON.stringify(images);

        const payload = {
            ...this.data.product,
            badge,
            image: mainImage,
            images: allImages
        };

        if (this.data.id) {
            put(`/farmer/products/${this.data.id}`, payload).then(this.handleResponse);
        } else {
            post(`/farmer/products?farmerId=${farmerId}`, payload).then(this.handleResponse);
        }
    },

    showErr(msg) {
        wx.showToast({ title: msg, icon: 'none' });
    },

    handleResponse(res) {
        if (res.code === 200) {
            wx.showToast({
                title: '提交成功',
                icon: 'success',
                success: () => {
                    setTimeout(() => {
                        wx.navigateBack();
                    }, 1500);
                }
            });
        } else {
            wx.showToast({ title: res.message || '提交失败', icon: 'none' });
        }
    }
})
