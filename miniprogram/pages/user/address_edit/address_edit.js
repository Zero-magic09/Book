// pages/user/address_edit/address_edit.js
const app = getApp();
const { post, put } = require('../../../utils/request.js');

Page({
    data: {
        id: null,
        userId: null,
        form: {
            name: '',
            phone: '',
            province: '选择省份',
            city: '选择城市',
            district: '选择区县',
            detail: '', // Corresponds to 'address' in DB
            isDefault: false
        },
        region: ['北京市', '北京市', '朝阳区']
    },

    onLoad(options) {
        const userId = wx.getStorageSync('userId');
        if (!userId) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }
        this.setData({ userId });

        if (options.id) {
            this.setData({ id: options.id });
            wx.setNavigationBarTitle({ title: '编辑收货地址' });
            this.loadAddress(options.id);
        } else {
            wx.setNavigationBarTitle({ title: '新增收货地址' });
        }
    },

    loadAddress(id) {
        // Fetch existing address data. Since we don't have GetSingleAddress, we reuse GetAddresses and find it
        // Or optimally we should have getById. For now let's reuse list and find.
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage && prevPage.data.addresses) {
            const addr = prevPage.data.addresses.find(a => a.id == id);
            if (addr) {
                this.setData({
                    form: {
                        name: addr.name,
                        phone: addr.phone,
                        province: addr.province,
                        city: addr.city,
                        district: addr.district,
                        detail: addr.detail,
                        isDefault: addr.isDefault
                    },
                    region: [addr.province, addr.city, addr.district]
                });
            }
        }
    },

    handleRegionChange(e) {
        const value = e.detail.value;
        this.setData({
            region: value,
            'form.province': value[0],
            'form.city': value[1],
            'form.district': value[2]
        });
    },

    handleInput(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [`form.${field}`]: e.detail.value
        });
    },

    handleSwitchChange(e) {
        this.setData({
            'form.isDefault': e.detail.value
        });
    },

    handleSave() {
        const { name, phone, province, city, district, detail } = this.data.form;

        // 验证基本信息
        if (!name || !phone || !detail) {
            wx.showToast({ title: '请填写完整信息', icon: 'none' });
            return;
        }

        // 验证地区选择
        if (province === '选择省份' || city === '选择城市' || district === '选择区县' || !province || !city || !district) {
            wx.showToast({ title: '请选择完整地区', icon: 'none' });
            return;
        }

        // 验证手机号格式
        if (!/^1\d{10}$/.test(phone)) {
            wx.showToast({ title: '手机号格式错误', icon: 'none' });
            return;
        }

        const data = {
            name, phone, province, city, district,
            address: detail, // Map detail to address field for backend
            isDefault: this.data.form.isDefault
        };

        if (this.data.id) {
            put(`/users/${this.data.userId}/addresses/${this.data.id}`, data).then(this.handleResponse);
        } else {
            post(`/users/${this.data.userId}/addresses`, data).then(this.handleResponse);
        }
    },

    handleResponse(res) {
        if (res.code === 200) {
            wx.showToast({ title: '保存成功', icon: 'success' });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        } else {
            wx.showToast({ title: res.message || '保存失败', icon: 'none' });
        }
    }
})
