// pages/user/payment/payment.js
const { get, post } = require('../../../utils/request.js');

Page({
    data: {
        orderIds: [],       // 支持多订单
        orders: [],         // 订单详情列表
        totalAmount: '0.00',
        orderCount: 0,
        userId: null,
        paymentMethods: [
            { id: 'wechat', name: '微信支付', icon: '💬', selected: true },
            { id: 'alipay', name: '支付宝', icon: '💎', selected: false },
            { id: 'bank', name: '银行卡', icon: '💳', selected: false }
        ],
        // 地址相关
        addresses: [],
        selectedAddress: null,
        showAddressModal: false,
        showManualInput: false,
        manualAddress: {
            name: '',
            phone: '',
            region: [],
            detail: ''
        }
    },

    onLoad(options) {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.setData({ userId: userInfo.userId });
            this.fetchAddresses(userInfo.userId);
        }

        // 支持多订单 (orderIds=1,2,3) 或单订单 (orderId=1)
        if (options.orderIds) {
            const orderIds = options.orderIds.split(',').map(id => parseInt(id));
            this.setData({ orderIds });
            this.fetchMultipleOrders(orderIds);
        } else if (options.orderId) {
            const orderId = parseInt(options.orderId);
            this.setData({ orderIds: [orderId] });
            this.fetchMultipleOrders([orderId]);
        }
    },

    async fetchAddresses(userId) {
        try {
            const res = await get(`/users/${userId}/addresses`);
            if (res.code === 200 && res.data) {
                const addresses = res.data.map(addr => ({
                    ...addr,
                    fullAddress: `${addr.province}${addr.city}${addr.district} ${addr.address}`
                }));

                // 设置默认地址为已选
                const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];

                this.setData({
                    addresses,
                    selectedAddress: defaultAddr || null
                });
            }
        } catch (err) {
            console.error('Fetch addresses failed', err);
        }
    },

    async fetchMultipleOrders(ids) {
        try {
            const orders = [];
            let totalAmount = 0;

            for (const id of ids) {
                const res = await get(`/orders/${id}`);
                if (res.code === 200) {
                    orders.push(res.data);
                    totalAmount += parseFloat(res.data.totalAmount || 0);
                }
            }

            this.setData({
                orders,
                orderCount: orders.length,
                totalAmount: totalAmount.toFixed(2)
            });
        } catch (err) {
            console.error('Fetch orders failed', err);
        }
    },

    showAddressPicker() {
        this.setData({ showAddressModal: true });
    },

    hideAddressPicker() {
        this.setData({ showAddressModal: false });
    },

    selectAddress(e) {
        const index = e.currentTarget.dataset.index;
        const address = this.data.addresses[index];
        this.setData({
            selectedAddress: address,
            showAddressModal: false
        });
    },

    toggleManualInput() {
        this.setData({
            showManualInput: !this.data.showManualInput
        });
    },

    onManualInput(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [`manualAddress.${field}`]: e.detail.value
        });
    },

    onRegionChange(e) {
        this.setData({
            'manualAddress.region': e.detail.value
        });
    },

    useManualAddress() {
        const { name, phone, region, detail } = this.data.manualAddress;

        if (!name.trim()) {
            wx.showToast({ title: '请输入收货人姓名', icon: 'none' });
            return;
        }
        if (!/^1\d{10}$/.test(phone)) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
            return;
        }
        if (!region || region.length < 3) {
            wx.showToast({ title: '请选择省市区', icon: 'none' });
            return;
        }
        if (!detail.trim()) {
            wx.showToast({ title: '请输入详细地址', icon: 'none' });
            return;
        }

        const fullAddress = `${region[0]}${region[1]}${region[2]} ${detail}`;

        this.setData({
            selectedAddress: {
                id: 'manual',
                name: name.trim(),
                phone: phone,
                province: region[0],
                city: region[1],
                district: region[2],
                address: detail.trim(),
                fullAddress: fullAddress
            },
            showAddressModal: false,
            showManualInput: false
        });

        wx.showToast({ title: '地址已设置', icon: 'success' });
    },

    selectMethod(e) {
        const id = e.currentTarget.dataset.id;
        const methods = this.data.paymentMethods.map(m => ({
            ...m,
            selected: m.id === id
        }));
        this.setData({ paymentMethods: methods });
    },

    async confirmPay() {
        if (!this.data.selectedAddress) {
            wx.showToast({ title: '请选择收货地址', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '安全支付中...' });

        try {
            const addr = this.data.selectedAddress;
            const addressStr = `${addr.fullAddress} (${addr.name} ${addr.phone})`;

            let successCount = 0;
            let errorMessage = '';

            // 批量更新地址并支付所有订单
            for (const orderId of this.data.orderIds) {
                try {
                    // 先更新订单地址
                    await post(`/orders/${orderId}/address`, { address: addressStr });

                    // 再支付
                    const res = await post(`/orders/${orderId}/pay`);
                    if (res.code === 200) {
                        successCount++;
                    } else {
                        errorMessage = res.message || '部分订单支付失败';
                    }
                } catch (err) {
                    console.error('Pay order failed:', orderId, err);
                    errorMessage = '网络错误';
                }
            }

            wx.hideLoading();

            if (successCount === this.data.orderIds.length) {
                wx.showToast({ title: '支付成功', icon: 'success' });
                setTimeout(() => {
                    wx.redirectTo({ url: '/pages/user/orders/orders?type=shipment' });
                }, 1500);
            } else if (successCount > 0) {
                wx.showToast({ title: `${successCount}/${this.data.orderIds.length}个订单支付成功`, icon: 'none' });
                setTimeout(() => {
                    wx.redirectTo({ url: '/pages/user/orders/orders?type=all' });
                }, 1500);
            } else {
                wx.showToast({ title: errorMessage || '支付失败', icon: 'none' });
            }
        } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '网络错误', icon: 'none' });
        }
    }
})
