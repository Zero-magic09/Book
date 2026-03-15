const { get, formatImageURL } = require('../../../utils/request.js');

Page({
    data: {
        activeTab: 'trace',
        tabItems: [
            { id: 'market', label: '集市', icon: '🏪' },
            { id: 'cart', label: '购物车', icon: '🛒' },
            { id: 'trace', label: '溯源', icon: '🔍' },
            { id: 'profile', label: '我的', icon: '👤' }
        ],
        traceRecords: [],
        userId: null
    },

    onLoad() {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.setData({ userId: userInfo.userId });
        }
        this.fetchOrders();
    },

    onShow() {
        wx.hideHomeButton();
        this.fetchOrders();
    },

    async fetchOrders() {
        if (!this.data.userId) return;
        try {
            const res = await get(`/orders/user/${this.data.userId}`);
            if (res.code === 200) {
                const apiOrders = res.data.content || res.data || [];
                const records = [];

                // 如果是扁平结构（每一行是一个 item）
                if (apiOrders.length > 0 && apiOrders[0].productName) {
                    apiOrders.forEach(item => {
                        records.push({
                            id: item.id || Math.random().toString(36),
                            orderId: item.orderNo,
                            status: this.formatStatus(item.status),
                            productName: item.productName,
                            realOrderId: item.orderId || item.id,
                            orderTime: this.formatTime(item.createdAt),
                            image: formatImageURL(item.productImage || 'https://picsum.photos/seed/order/200/200'),
                            price: item.price,
                            quantity: item.quantity,
                            productId: item.productId || (item.product ? item.product.id : '1')
                        });
                    });
                } else {
                    // 如果是嵌套结构 (Order -> items)
                    apiOrders.forEach(order => {
                        if (order.items && order.items.length > 0) {
                            order.items.forEach(item => {
                                records.push({
                                    id: item.id,
                                    orderId: order.orderNo,
                                    status: this.formatStatus(order.status),
                                    productName: item.productName,
                                    realOrderId: order.id,
                                    orderTime: this.formatTime(order.createdAt),
                                    image: formatImageURL(item.productImage || 'https://picsum.photos/seed/order/200/200'),
                                    price: item.price,
                                    quantity: item.quantity,
                                    productId: item.productId || (item.product ? item.product.id : '1')
                                });
                            });
                        }
                    });
                }

                this.setData({ traceRecords: records });
            }
        } catch (err) {
            console.error('Fetch orders failed', err);
            this.setData({ traceRecords: [] });
        }
    },

    formatStatus(status) {
        const map = {
            'PENDING': '待支付',
            'PAID': '待发货',
            'SHIPPED': '待收货',
            'DELIVERED': '待评价',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消'
        };
        return map[status] || status;
    },

    formatTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    },

    handleTabSelect(e) {
        const tabId = e.detail.id || e.detail;
        if (tabId === 'trace') return;

        const urls = {
            market: '/pages/user/marketplace/marketplace',
            cart: '/pages/user/cart/cart',
            profile: '/pages/user/profile/profile'
        };

        if (urls[tabId]) wx.reLaunch({ url: urls[tabId] });
    },

    viewTraceDetail(e) {
        const productId = e.currentTarget.dataset.productid;
        const productName = e.currentTarget.dataset.name;

        if (productId) {
            // 生成随机演示数据
            const logs = this.generateRandomLogs();
            const batchNo = this.generateBatchNo();

            this.setData({
                showTraceModal: true,
                currentTraceInfo: {
                    productName: productName,
                    batchNo: batchNo,
                    origin: '生态种植基地',
                    growthCycle: '120天'
                },
                currentTraceLogs: logs
            });
        } else {
            wx.showToast({ title: '溯源信息暂无', icon: 'none' });
        }
    },

    closeTraceModal() {
        this.setData({ showTraceModal: false });
    },

    generateBatchNo() {
        const date = new Date();
        const yaaa = date.getFullYear().toString().substr(2);
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `TR${yaaa}${mm}${dd}${random}`;
    },

    formatDate(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    },

    generateRandomLogs() {
        const actions = [
            { type: '播种', content: '选用优质种子，进行土壤翻耕和底肥施用。' },
            { type: '灌溉', content: '引入山泉水进行灌溉，保证土壤湿度适宜。' },
            { type: '除草', content: '人工除草，不使用除草剂，保护生态环境。' },
            { type: '施肥', content: '施用农家有机肥，补充作物生长所需营养。' },
            { type: '质检', content: '农技员进行病虫害监测，作物生长状况良好。' },
            { type: '采摘', content: '果实成熟，人工精心采摘，筛选优质果实。' }
        ];

        const count = Math.floor(Math.random() * 3) + 3; // 随机生成 3-5 条记录
        const logs = [];
        const updateTime = new Date();

        for (let i = 0; i < count; i++) {
            // 每条记录时间倒推 5-10 天
            updateTime.setDate(updateTime.getDate() - Math.floor(Math.random() * 5) - 5);
            const action = actions[Math.floor(Math.random() * actions.length)];

            logs.push({
                date: this.formatDate(updateTime),
                type: action.type,
                content: action.content
            });
        }

        return logs;
    },

    viewLogistics(e) {
        wx.showToast({ title: '商品正在运输中', icon: 'none' });
    }
})
