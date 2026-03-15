// pages/user/addresses/addresses.js
const app = getApp();
const { get, post, put, del } = require('../../../utils/request.js');

Page({
    data: {
        addresses: [],
        userId: null
    },

    onLoad() {
        const userId = wx.getStorageSync('userId');
        if (!userId) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }
        this.setData({ userId });
        this.fetchAddresses();
    },

    onShow() {
        this.fetchAddresses();
    },

    fetchAddresses() {
        if (!this.data.userId) return;

        get(`/users/${this.data.userId}/addresses`).then(res => {
            if (res.code === 200) {
                const addresses = res.data.map(addr => ({
                    id: addr.id,
                    name: addr.name,
                    phone: addr.phone,
                    province: addr.province,
                    city: addr.city,
                    district: addr.district,
                    detail: addr.address, // Backend field is 'address'
                    fullAddress: `${addr.province}${addr.city}${addr.district} ${addr.address}`,
                    isDefault: addr.isDefault,
                    tag: addr.isDefault ? '默认' : ''
                }));
                this.setData({ addresses });
            }
        });
    },

    handleEdit(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/user/address_edit/address_edit?id=${id}`
        });
    },

    handleAdd() {
        wx.navigateTo({
            url: '/pages/user/address_edit/address_edit'
        });
    },

    // 长按删除
    handleLongPress(e) {
        this.handleDelete(e);
    },

    handleDelete(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '删除地址',
            content: '确定要删除该收货地址吗？',
            success: (res) => {
                if (res.confirm) {
                    this.deleteAddress(id);
                }
            }
        });
    },

    deleteAddress(id) {
        del(`/users/${this.data.userId}/addresses/${id}`).then(res => {
            if (res.code === 200) {
                wx.showToast({ title: '已删除', icon: 'success' });
                this.fetchAddresses();
            } else {
                wx.showToast({ title: res.message || '删除失败', icon: 'none' });
            }
        });
    },

    handleSelect(e) {
        // 如果是选择模式（比如从确认订单页过来），则返回并携带数据
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage && prevPage.route.includes('checkout')) {
            const index = e.currentTarget.dataset.index;
            const selectedAddress = this.data.addresses[index];
            prevPage.setData({ selectedAddress });
            wx.navigateBack();
        }
    }
})
