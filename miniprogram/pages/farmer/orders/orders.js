// pages/farmer/orders/orders.js
const app = getApp();
const { get, post, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        activeTab: 'orders',
        tabItems: [
            { id: 'home', label: '工作台', icon: '🌱' },
            { id: 'products', label: '商品库', icon: '📦' },
            { id: 'orders', label: '订单管理', icon: '📑' },
            { id: 'me', label: '农场主', icon: '👤' }
        ],
        activeTabOrder: 0,
        tabs: [
            { id: 0, name: '全部', type: 'all' },
            { id: 1, name: '待发货', type: 'PAID' },
            { id: 2, name: '已发货', type: 'SHIPPED' },
            { id: 3, name: '已完成', type: 'COMPLETED' }
        ],
        orders: [],
        filteredOrders: []
    },

    onLoad(options) {
        this.loadOrders();
    },

    onShow() {
        wx.hideHomeButton();
        this.loadOrders();
    },

    loadOrders() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const farmerId = storedUser ? storedUser.farmerId : null;

        if (!farmerId) {
            console.error('未找到农户ID');
            return;
        }

        get(`/orders/farmer/${farmerId}`).then(res => {
            if (res.code === 200) {
                const orders = (res.data.content || []).map(o => {
                    const products = (o.items || []).map(item => ({
                        name: item.productName,
                        image: formatImageURL(item.productImage),
                        price: item.price,
                        quantity: item.quantity
                    }));

                    return {
                        id: o.orderNo,
                        orderId: o.id,
                        status: o.status,
                        statusText: this.getStatusText(o.status),
                        products: products,
                        total: o.totalAmount,
                        address: this.parseAddress(o.addressSnapshot)
                    };
                });
                this.setData({ orders });
                this.filterOrders();
            }
        }).catch(err => {
            console.error('加载订单列表失败:', err);
        });
    },

    getStatusText(status) {
        const statusMap = {
            'PENDING': '待支付',
            'PAID': '待发货',
            'SHIPPED': '待收货',
            'DELIVERED': '已完成',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消'
        };
        return statusMap[status] || status;
    },

    parseAddress(snapshot) {
        try {
            const addr = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
            if (!addr) return '地址信息';

            const parts = [];
            if (addr.name) parts.push(addr.name);
            if (addr.phone) parts.push(addr.phone);
            if (addr.address) parts.push(addr.address);

            return parts.length > 0 ? parts.join(' ') : '地址信息';
        } catch (e) {
            return '地址信息';
        }
    },

    handleTabClick(e) {
        this.setData({ activeTabOrder: e.currentTarget.dataset.index });
        this.filterOrders();
    },

    filterOrders() {
        const type = this.data.tabs[this.data.activeTabOrder].type;
        if (type === 'all') {
            this.setData({ filteredOrders: this.data.orders });
        } else if (type === 'COMPLETED') {
            // "已完成"标签包含 COMPLETED 和 DELIVERED (兼容旧数据)
            this.setData({
                filteredOrders: this.data.orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED')
            });
        } else {
            this.setData({ filteredOrders: this.data.orders.filter(o => o.status === type) });
        }
    },

    handleContact() {
        wx.showToast({ title: '已联系买家', icon: 'none' });
    },

    handleShip(e) {
        const orderId = e.currentTarget.dataset.id;

        wx.showModal({
            title: '确认发货',
            content: '确定要发货吗？',
            success: (res) => {
                if (res.confirm) {
                    post(`/orders/${orderId}/ship`).then(res => {
                        if (res.code === 200) {
                            wx.showToast({ title: '发货成功', icon: 'success' });
                            this.loadOrders();
                        } else {
                            wx.showToast({ title: res.message || '发货失败', icon: 'none' });
                        }
                    }).catch(err => {
                        console.error('发货失败:', err);
                        wx.showToast({ title: '发货失败', icon: 'none' });
                    });
                }
            }
        });
    },

    handleTabSelect(e) {
        const tabId = e.detail.id || e.detail;
        if (tabId === 'orders') return;

        const urls = {
            home: '/pages/farmer/dashboard/dashboard',
            products: '/pages/farmer/products/products',
            me: '/pages/farmer/profile/profile'
        };

        if (urls[tabId]) wx.reLaunch({ url: urls[tabId] });
    }
})
