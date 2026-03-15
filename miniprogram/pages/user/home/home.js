// pages/user/home/home.js
const app = getApp()
const { get } = require('../../../utils/request.js');

Page({
    data: {
        activeTab: 'home',
        activeFilter: '',
        filters: ['产地直供', '现摘现发', '有机认证', '地理标志'],
        categories: [
            { id: 'fruits', name: '时令果蔬', icon: '🍎', bg: 'bg-rose-50 text-rose-500' },
            { id: 'grain', name: '五谷粮油', icon: '🌾', bg: 'bg-amber-50 text-amber-500' },
            { id: 'meat', name: '农家畜禽', icon: '🥩', bg: 'bg-orange-50 text-orange-500' },
            { id: 'dried', name: '山珍干货', icon: '🍄', bg: 'bg-emerald-50 text-emerald-500' },
        ],
        cartItems: [
            { id: 1, name: '高山精选蜜薯', farmer: '老张生态农场', price: 29.9, unit: '5斤', qty: 1, img: 'https://picsum.photos/seed/harvest1/200/200' },
            { id: 2, name: '烟台红富士苹果', farmer: '栖霞果园', price: 39.9, unit: '5斤', qty: 2, img: 'https://picsum.photos/seed/harvest2/200/200' },
        ],
        products: [], // 初始化为空数组
        orderStates: [
            { label: '待支付', icon: '💳', count: 0, status: 'unpaid' },
            { label: '待发货', icon: '📦', count: 2, status: 'unshipped' },
            { label: '待收货', icon: '🚚', count: 1, status: 'undelivered' },
            { label: '待评价', icon: '📝', count: 0, status: 'unreviewed' },
        ],
        menuGroups: [
            {
                title: '常用服务',
                items: [
                    { label: '收货地址', icon: '📍', extra: '3个常用地址', path: '/pages/user/addresses/addresses' },
                    { label: '实名认证', icon: '🆔', extra: '已认证', status: 'verified', path: '/pages/user/identity/identity' },
                    { label: '领券中心', icon: '🎟️', extra: '2张可用', path: '/pages/user/coupons/coupons' },
                    { label: '关于乡味', icon: '🍃', extra: '了解我们', path: '/pages/user/about/about' },
                ]
            }
        ],
        tabItems: [
            { id: 'home', label: '集市', icon: '🧺' },
            { id: 'cart', label: '购物车', icon: '🛒' },
            { id: 'order', label: '溯源单', icon: '📝' },
            { id: 'me', label: '我的', icon: '👤' }
        ],
        totalPrice: '0.00',
        headerTitle: ''
    },

    onLoad() {
        this.calculateTotal();
        this.fetchProducts();
    },

    async fetchProducts() {
        try {
            const res = await get('/products', { size: 10 });
            if (res.code === 200) {
                this.setData({
                    products: res.data.content
                });
            }
        } catch (err) {
            console.error('Fetch products failed', err);
        }
    },

    handleTabSelect(e) {
        const id = e.detail;
        this.setData({ activeTab: id });
        this.updateHeaderTitle(id);
    },

    updateHeaderTitle(tab) {
        let title = '';
        if (tab === 'cart') title = '我的购物车';
        if (tab === 'order') title = '溯源订单';
        this.setData({ headerTitle: title });
    },

    handleFilterSelect(e) {
        const filter = e.currentTarget.dataset.filter;
        this.setData({
            activeFilter: this.data.activeFilter === filter ? '' : filter
        });
    },

    updateQty(e) {
        const { id, delta } = e.currentTarget.dataset;
        const newCartItems = this.data.cartItems.map(item => {
            if (item.id === id) {
                return { ...item, qty: Math.max(1, item.qty + delta) };
            }
            return item;
        });
        this.setData({ cartItems: newCartItems });
        this.calculateTotal();
    },

    calculateTotal() {
        const total = this.data.cartItems.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);
        this.setData({ totalPrice: total });
    },

    handleProductClick(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/user/product_detail/product_detail?id=${id}`
        });
    },

    handleOrderClick(e) {
        const status = e.currentTarget.dataset.status;
        wx.navigateTo({
            url: `/pages/user/orders/orders?status=${status}`
        });
    },

    handleMenuClick(e) {
        const path = e.currentTarget.dataset.path;
        if (path) {
            wx.navigateTo({ url: path });
        }
    },

    handleEditProfile() {
        wx.navigateTo({ url: '/pages/user/profile_edit/profile_edit' });
    },

    handleLogout() {
        wx.reLaunch({
            url: '/pages/index/index'
        });
    }
})
