const { get, post, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        activeCategory: 0,
        activeTab: 'market',
        tabItems: [
            { id: 'market', label: '集市', icon: '🏪' },
            { id: 'cart', label: '购物车', icon: '🛒' },
            { id: 'trace', label: '溯源', icon: '🔍' },
            { id: 'profile', label: '我的', icon: '👤' }
        ],
        bannerImage: 'https://picsum.photos/seed/market_banner/600/300',
        categories: [
            { id: 1, name: '时令果蔬', icon: '🍎' },
            { id: 2, name: '五谷杂油', icon: '🌾' },
            { id: 3, name: '农家禽畜', icon: '🍓' },
            { id: 4, name: '山珍干货', icon: '🍄' }
        ],
        products: []
    },

    onLoad() {
        this.fetchProducts();
    },

    onShow() {
        wx.hideHomeButton();
        this.fetchProducts();
    },

    async fetchProducts() {
        try {
            const res = await get('/products', { size: 10 });
            if (res.code === 200) {
                const rawProducts = res.data.content || [];
                const products = rawProducts.map(p => {
                    // Split badge by comma and take first 2
                    let badges = [];
                    if (p.badge) {
                        badges = p.badge.split(/[,，]/).filter(s => s && s.trim()).slice(0, 2);
                    }
                    return {
                        ...p,
                        image: formatImageURL(p.image),
                        badges: badges
                    };
                });
                this.setData({ products });
            }
        } catch (err) {
            console.error('[Marketplace] Fetch products failed', err);
        }
    },

    handleTabSelect(e) {
        const tabId = e.detail.id || e.detail;
        if (tabId === 'market') return;

        const urls = {
            cart: '/pages/user/cart/cart',
            trace: '/pages/user/traceability/traceability',
            profile: '/pages/user/profile/profile'
        };

        if (urls[tabId]) wx.reLaunch({ url: urls[tabId] });
    },

    switchTab(e) {
        const index = parseInt(e.currentTarget.dataset.index);
        this.setData({ activeCategory: index });
    },

    selectCategory(e) {
        // 分类功能暂不提示弹窗
    },

    viewProduct(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/user/product_detail/product_detail?id=${id}`
        });
    },

    async toggleFavorite(e) {
        // 阻止冒泡，避免跳转详情页
        const productId = e.currentTarget.dataset.id;
        const index = e.currentTarget.dataset.index;
        const userInfo = wx.getStorageSync('userInfo');

        console.log('[toggleFavorite] Clicked product:', productId, 'Index:', index);

        if (!userInfo || !userInfo.userId) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        if (index === undefined || index === null) {
            console.error('Invalid index:', index);
            return;
        }

        const products = this.data.products;
        const isFavorited = products[index].isFavorited || false;
        const newStatus = !isFavorited;

        // 乐观更新 UI (使用数据路径更新)
        this.setData({
            [`products[${index}].isFavorited`]: newStatus
        });

        try {
            // 调用后端接口更新收藏数 (increment: true for add, false for remove)
            const res = await post(`/users/${userInfo.userId}/favorites`, {
                productId: productId,
                increment: newStatus
            });

            if (res.code === 200) {
                wx.showToast({ title: res.message, icon: 'none' });
            } else {
                // 失败回滚
                this.setData({
                    [`products[${index}].isFavorited`]: isFavorited
                });
                wx.showToast({ title: res.message || '操作失败', icon: 'none' });
            }
        } catch (err) {
            console.error('Toggle favorite failed', err);
            // 失败回滚
            this.setData({
                [`products[${index}].isFavorited`]: isFavorited
            });
            wx.showToast({ title: '操作失败', icon: 'none' });
        }
    }
})
